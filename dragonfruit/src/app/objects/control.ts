export class Display {
    id: string;
    name: string;
    icon: string;
    input: string;
    blanked: boolean;
    allowedInputs: string[];
}

export class Input {
    id: string;
    name: string;
    icon: string;
    subInputs: Input[];
}

export class ControlGroup {
    id: string;
    name: string;
    displays: Display[];
    inputs: Input[];
    audioGroups: AudioGroup[];
    presentGroups: PresentGroup[];

    public listDisplays(): string {
        let toReturn = '';
        if (this.displays !== undefined && this.displays.length > 0) {
            for (const d of this.displays) {
                const name = d.id.split('-')[2];
                toReturn += name + ' ';
            }

            return toReturn;
        } else {
            return toReturn;
        }
    }
}

export class AudioDevice {
    id: string;
    name: string;
    icon: string;
    level: number;
    muted: boolean;
}

export class AudioGroup {
    id: string;
    name: string;
    audioDevices: AudioDevice[];
}

export class PresentGroup {
    id: string;
    name: string;
    items: PresentItem[];
}

export class PresentItem {
    id: string;
    name: string;
}

export class SharingGroup {
    id: string;
    name: string;
    fromDisplay: string;
    toDisplays: string[];
    curGroupMembers: string[];
}

export class Room {
    id: string;
    name: string;
    controlGroups: ControlGroup[];
    selectedGroup: string;
    sharingGroups: SharingGroup[];

    constructor(id?: string, name?: string) {
        if (id !== undefined) {
            this.id = id;
        }
        if (name !== undefined && name.length > 0) {
            this.name = name;
        } else {
            this.name = id;
        }
    }
}
