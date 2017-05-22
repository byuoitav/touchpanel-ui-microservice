package publisher

import (
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"log"
	"net"

	"github.com/xuther/go-message-router/common"
)

const debug = false

type Publisher interface {
	Listen() error
	Write(common.Message) error
	Close()
}

type publisher struct {
	subscriptions    []*subscription
	port             string
	listener         *net.TCPListener
	subscribeChan    chan *subscription
	UnsubscribeChan  chan *subscription
	writeQueueSize   int
	distributionChan chan common.Message
}

type subscription struct {
	pub        *publisher
	Connection *net.TCPConn
	WriteQueue chan common.Message
}

func NewPublisher(port string, writeQueueSize int, subscribeChanSize int) (Publisher, error) {
	return &publisher{
		port:             port,
		writeQueueSize:   writeQueueSize,
		subscribeChan:    make(chan *subscription, subscribeChanSize),
		UnsubscribeChan:  make(chan *subscription, subscribeChanSize),
		distributionChan: make(chan common.Message, writeQueueSize),
	}, nil
}

//Listen will start a TCP listener bound to the port in the publisher in a separate go routine. Connections are added to the subscriptions slice
//Use the Write function to send a message to all subscribers
func (p *publisher) Listen() error {

	if len(p.port) == 0 {
		return errors.New("The publisher must be initialized with a port")
	}
	addr, err := net.ResolveTCPAddr("tcp", ":"+p.port)
	if err != nil {
		err = errors.New(fmt.Sprintf("Error resolving the TCP addr %s: %s", p.port, err.Error()))
		log.Printf(err.Error())
		return err
	}

	ln, err := net.ListenTCP("tcp", addr)
	if err != nil {
		return err
	}

	//Start the membership routine
	p.runMembership()

	//Start the broadcast routine
	p.runBroadcaster()

	defer ln.Close()
	for {
		conn, err := ln.AcceptTCP()
		if err != nil {
			log.Printf("Error recieving connection: %s", err.Error())
			continue
		}
		p.subscribeChan <- &subscription{Connection: conn, WriteQueue: make(chan common.Message, p.writeQueueSize), pub: p}
	}
	return nil
}

func (p *publisher) Close() {
	p.listener.Close()
}

func (p *publisher) Write(event common.Message) error {
	if debug {
		log.Printf("sending a message to the distribution channel")
	}

	p.distributionChan <- event
	return nil
}

func (p *publisher) runBroadcaster() error {
	go func() {
		d := 0
		log.Printf("Starting distribution Channel")
		for {
			curMessage := <-p.distributionChan
			if debug {
				log.Printf("Received a message in distribution channel. Distributing...")
			}
			for i := range p.subscriptions {
				select {
				case p.subscriptions[i].WriteQueue <- curMessage:
				default:
					d++
					if d%100 == 0 {
						log.Printf("%v discarded.", d)
					}
					//log.Printf("Channel full for %v, discarding", p.subscriptions[i].Connection.RemoteAddr().String())
				}
			}
		}
	}()
	return nil
}

//runMembership handles adding and removing from the membership array
func (p *publisher) runMembership() {
	go func() {
		for {
			select {

			//Add a subscription
			case subscription := <-p.subscribeChan:
				log.Printf("Subscription receieved for %s", subscription.Connection.RemoteAddr().String())
				p.subscriptions = append(p.subscriptions, subscription)
				subscription.StartWriter()
				break

			//Remove a subscription
			case subscription := <-p.UnsubscribeChan:
				for i := range p.subscriptions {
					if p.subscriptions[i] == subscription {
						//This is the go sanctioned way of deleting an item from an array that contains pointers for garbage collection.
						//Note that due to the format of slice headers the calculation fo len(slice) is constant time.
						p.subscriptions[i].Connection.Close() //make sure the connection is closed, if it's already closed, don't worry about it
						p.subscriptions[i] = p.subscriptions[len(p.subscriptions)-1]
						p.subscriptions[len(p.subscriptions)-1] = nil
						p.subscriptions = p.subscriptions[:len(p.subscriptions)-1]
						break
					}
				}
				break

			}

		}

	}()
}

//StartWriter runs a writer routine for the subscription, listening for messages to send
func (s *subscription) StartWriter() {
	go func() {
		for {
			select {
			case toWrite := <-s.WriteQueue:
				if debug {
					log.Printf("Sending Message to %s", s.Connection.RemoteAddr().String())
				}

				//We need to write out the Length
				messageLen := make([]byte, 4)
				binary.LittleEndian.PutUint32(messageLen, uint32(len(toWrite.MessageBody)))

				//Build our packet to send
				toWriteBytes := append(toWrite.MessageHeader[:], messageLen[:]...)
				toWriteBytes = append(toWriteBytes, toWrite.MessageBody...)

				//send
				numWritten, err := s.Connection.Write(toWriteBytes)
				if err != nil || numWritten != len(toWriteBytes) {
					if err != nil {
						if err == io.EOF {
							log.Printf("Connection closed : %s", s.Connection.RemoteAddr().String())
							s.pub.UnsubscribeChan <- s //end the connection to be removed and closed
							return                     //End
						} else {
							log.Printf("ERROR: there was a problem with the connection to client: %s. Message: %s", s.Connection.RemoteAddr().String(), err.Error())
						}
					} else {
						log.Printf("There was a problem sending an event to %s: not all bytes were written", s.Connection.RemoteAddr().String())
					}
				}
			}
		}
	}()
}
