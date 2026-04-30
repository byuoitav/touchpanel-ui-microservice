package couch

import (
	"fmt"

	"github.com/byuoitav/touchpanel-ui-microservice/structs"
)

// GetHelpSchedule fetches a help/support schedule document by id from CouchDB.
func (c *CouchDB) GetHelpSchedule(id string) (structs.HelpSchedule, error) {
	var schedule structs.HelpSchedule

	err := c.MakeRequest("GET", fmt.Sprintf("%s/%s", SUPPORT_SCHEDULES, id), "", nil, &schedule)
	if err != nil {
		return schedule, fmt.Errorf("error getting help schedule %s: %w", id, err)
	}

	return schedule, nil
}
