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
    helpRequested: boolean;

    constructor() {
        this.helpRequested = false;
    }

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

    public getAudioDevice(id: string): AudioDevice {
        for (const g of this.audioGroups) {
            for (const device of g.audioDevices) {
                if (device.id === id) {
                    return device;
                }
            }
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

    public allAreMuted(): boolean {
        for (const a of this.audioDevices) {
            if (!a.muted) {
                return false;
            }
        }

        return true;
    }
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

export const CONTROL_TAB = 'Control';
export const AUDIO_TAB = 'Audio';
export const PRESENT_TAB = 'Present';
export const HELP_TAB = 'Help';
