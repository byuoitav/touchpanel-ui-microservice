package common

type Message struct {
	MessageHeader [24]byte //Header is the event type
	MessageBody   []byte   //Body can be whatever message is desired.
}
