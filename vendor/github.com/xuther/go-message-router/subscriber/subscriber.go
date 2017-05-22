package subscriber

import (
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"regexp"

	"github.com/xuther/go-message-router/common"
)

type Subscriber interface {
	Subscribe(address string, filter []string) error
	Read() common.Message
	Close()
}

type subscriber struct {
	aggregateQueueSize int
	subscriptions      []*readSubscription
	QueuedMessages     chan common.Message
	subscribeChan      chan *readSubscription
	unsubscribeChan    chan *readSubscription
}

type readSubscription struct {
	FilterList []*regexp.Regexp
	Address    string
	Sub        *subscriber
	Connection *net.TCPConn
}

func NewSubscriber(aggregateQueueSize int) (Subscriber, error) {

	toReturn := subscriber{
		aggregateQueueSize: aggregateQueueSize,
		QueuedMessages:     make(chan common.Message, aggregateQueueSize),
		subscribeChan:      make(chan *readSubscription, 10),
		unsubscribeChan:    make(chan *readSubscription, 10),
	}
	toReturn.startSubscriptionManager()

	return &toReturn, nil
}

func (s *subscriber) Close() {
}

func (s *subscriber) Read() common.Message {
	return <-s.QueuedMessages

}

func (s *subscriber) Subscribe(address string, filters []string) error {
	compiledFilters := []*regexp.Regexp{}
	for _, filter := range filters {
		val, err := regexp.Compile(filter)
		if err != nil {
			err = errors.New(fmt.Sprintf("Error compiling filter %s: %s", filter, err.Error()))
			return err
		}
		compiledFilters = append(compiledFilters, val)
	}

	addr, err := net.ResolveTCPAddr("tcp", address)
	if err != nil {
		err = errors.New(fmt.Sprintf("Error resolving the TCP addr %s: %s", address, err.Error()))
		log.Printf(err.Error())
		return err
	}

	conn, err := net.DialTCP("tcp", nil, addr)
	if err != nil {
		log.Printf("Error establishing a connection with %s: %s", address, err.Error())
		return err
	}

	log.Printf("Connection sent")

	subscription := readSubscription{
		Address:    address,
		Sub:        s,
		Connection: conn,
		FilterList: compiledFilters,
	}

	log.Printf("Subscription created, adding to manager")

	s.subscribeChan <- &subscription
	return nil
}

func (s *subscriber) startSubscriptionManager() {
	log.Printf("Starting subscription Manager.")
	go func() {
		for {
			select {
			case sub := <-s.subscribeChan:
				log.Printf("Subscribed.")
				s.subscriptions = append(s.subscriptions, sub)
				sub.StartListener()

			case unsub := <-s.unsubscribeChan:
				for k, i := range s.subscriptions {
					if i == unsub { //remove from our list of subscribers
						s.subscriptions[k] = s.subscriptions[len(s.subscriptions)-1]
						s.subscriptions = s.subscriptions[:len(s.subscriptions)-1]
					}
				}
			}
		}
	}()
}

func (rs *readSubscription) StartListener() {
	go func() {
		log.Printf("Starting listener")
		for {
			headerAndLen := make([]byte, 28)

			num, err := rs.Connection.Read(headerAndLen)
			if err != nil {
				if err == io.EOF {
					log.Printf("The connection for %s was closed", rs.Address)
					rs.Sub.unsubscribeChan <- rs
					return
				}

				log.Printf("There was a problem reading from the connection to %s", rs.Address)
				continue
			}

			//Get the length out of the message
			messageLen := binary.LittleEndian.Uint32(headerAndLen[24:])

			//pull out the rest of the message.
			message := make([]byte, messageLen)
			num, err = rs.Connection.Read(message)
			if err != nil {
				if err == io.EOF {
					log.Printf("The connection for %s was closed", rs.Address)
					rs.Sub.unsubscribeChan <- rs
					return
				}
				log.Printf("There was a problem reading from the connection to %s", rs.Address)
				continue
			}
			if num != int(messageLen) {
				log.Printf("Not all of the message was recieved")

			}

			//check the header to see if we care about the message
			for _, filter := range rs.FilterList {

				//only read in the message if it meets the criteria
				if filter.Match(headerAndLen[:24]) {
					header := [24]byte{}
					copy(header[:], headerAndLen[:24])
					rs.Sub.QueuedMessages <- common.Message{MessageHeader: header, MessageBody: message}
					break
				}
			}
		}
	}()
}
