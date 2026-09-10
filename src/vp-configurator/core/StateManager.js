export class StateManager {
    constructor() {
        this.state = {
            gender: 'male',
            mannequinVisible: true,
            garments: {
                top: null,
                bottom: null,
                jacket: null,
                comboset: null
            },
            colors: {
                top: '#ffffff',
                bottom: '#ffffff',
                jacket: '#ffffff',
                mannequin: '#cccccc'
            },
            environment: {
                hdr: 'venice_sunset_1k.hdr',
                intensity: 1,
                bgColor: '#111111'
            },
            performance: false
        };
        this.listeners = [];
    }

    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    update(path, value) {
        const keys = path.split('.');
        let current = this.state;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        this.notify();
    }

    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.getState());
    }

    notify() {
        const state = this.getState();
        this.listeners.forEach(callback => callback(state));
    }
}
