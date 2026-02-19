class HelpService {
    constructor(scheduleData = {}) {
        this.schedule = new HelpSchedule(scheduleData);
    }
}

class HelpSchedule {
    constructor({
        _id = "",
        description = "",
        "over-ride": override = "",
        timezone = "",
        phoneNumber = "",
        openMessage = {},
        closedMessages = {},
        closures = []
    } = {}) {
        this.id = _id;
        this.description = description;
        this.override = override;
        this.timezone = timezone;
        this.phoneNumber = phoneNumber;
        this.openMessage = new HelpMessage(openMessage);
        this.closedMessages = Object.entries(closedMessages || {}).reduce((acc, [key, msg]) => {
            acc[key] = new HelpMessage(msg);
            return acc;
        }, {});
        this.closures = (closures || []).map(c => new HelpClosure(c));
    }
}

class HelpMessage {
    constructor({
        title = "",
        message = "",
        requestButton = false,
        requestButtonLabel = "",
        dismissButtonLabel = ""
    } = {}) {
        this.title = title;
        this.message = message;
        this.requestButton = requestButton;
        this.requestButtonLabel = requestButtonLabel;
        this.dismissButtonLabel = dismissButtonLabel;
    }
}

class HelpClosure {
    constructor({
        label = "",
        message = "",
        days = [],
        from = "",
        to = ""
    } = {}) {
        this.label = label;
        this.message = message; // key referencing closedMessages
        this.days = days;
        this.from = from;
        this.to = to;
    }
}
