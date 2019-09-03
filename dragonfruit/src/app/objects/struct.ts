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

export class Room {
    id: string;
    name: string;
    controlGroups: ControlGroup[];
    selectedGroup: string;
}

export class ControlGroup {
    id: string;
    name: string;
    displays: Display[];
    inputs: Input[];
    audioGroups: AudioGroup[];
    presentGroups: 
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