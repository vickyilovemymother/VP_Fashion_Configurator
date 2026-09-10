export class StateManager {
    constructor() {
        this.state = {
            gender: 'male',
            mode: 'mix', // 'mix' or 'dress'
            mix: {
                top: null,
                bottom: null,
                jacket: null
            },
            dress: {
                comboId: null
            },
            colors: {
                top: '#ffffff',
                bottom: '#ffffff',
                jacket: '#ffffff',
                dress: '#ffffff',
                mannequin: '#ffffff',
                background: '#050505'
            },
            environment: {
                intensity: 2,
                visible: true,
                hdr: 'venice_sunset',
                rotation: 0,
                bg360Url: null
            },
            mannequinVisible: true,
            performance: false,
            fadeEnabled: false,
            shadowsEnabled: true,
            shadowIntensity: 1.0,
            gridVisible: true
        };
        
        this.listeners = [];
    }

    update(key, value) {
        console.log(`StateManager: Updating ${key} to`, value);
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            this.state[parent][child] = value;
        } else {
            this.state[key] = value;
        }
        this.notify();
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.state));
    }

    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }
}
