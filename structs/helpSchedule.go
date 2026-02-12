package structs

// HelpSchedule represents the help/support availability configuration.
// It matches the JSON structure used by the support-hours schedule document.
type HelpSchedule struct {
	ID             string                 `json:"_id"`
	Description    string                 `json:"description"`
	Override       string                 `json:"over-ride"` // optional alternate schedule id
	Timezone       string                 `json:"timezone"`
	PhoneNumber    string                 `json:"phoneNumber"`
	OpenMessage    HelpMessage            `json:"openMessage"`
	ClosedMessages map[string]HelpMessage `json:"closedMessages"`
	Closures       []HelpClosure          `json:"closures"`
}

// HelpMessage is the dialog shown for open/closed states.
type HelpMessage struct {
	Title              string `json:"title"`
	Message            string `json:"message"`
	RequestButton      bool   `json:"requestButton"`
	RequestButtonLabel string `json:"requestButtonLabel,omitempty"`
	DismissButtonLabel string `json:"dismissButtonLabel"`
}

// HelpClosure defines a time window where a specific closed message applies.
type HelpClosure struct {
	Label   string   `json:"label"`
	Message string   `json:"message"` // key into ClosedMessages
	Days    []string `json:"days"`    // e.g. ["mon","tue"]
	From    string   `json:"from"`    // "HH:MM" 24-hour
	To      string   `json:"to"`      // "HH:MM" 24-hour
}
