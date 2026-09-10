export const URLUtils = {
    encodeState: (state) => {
        const params = new URLSearchParams();
        params.set('mode', state.mode);
        params.set('g', state.gender);
        params.set('mv', state.mannequinVisible ? '1' : '0');
        params.set('fe', state.fadeEnabled ? '1' : '0');
        params.set('se', state.shadowsEnabled ? '1' : '0');
        params.set('si', state.shadowIntensity);
        
        // Garments
        if (state.mode === 'mix') {
            if (state.mix.top) params.set('top', state.mix.top);
            if (state.mix.bottom) params.set('bottom', state.mix.bottom);
            if (state.mix.jacket) params.set('jacket', state.mix.jacket);
        } else {
            if (state.dress.comboId) params.set('combo', state.dress.comboId);
        }

        // Colors
        Object.keys(state.colors).forEach(cat => {
            if (state.colors[cat]) {
                params.set(`${cat}_c`, state.colors[cat].replace('#', ''));
            }
        });

        // Env
        params.set('hdr', state.environment.hdr);
        params.set('hi', state.environment.intensity);
        params.set('hr', state.environment.rotation);
        if (state.colors.background) {
            params.set('bg', state.colors.background.replace('#', ''));
        }
        
        const newUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);
        return newUrl;
    },
    
    decodeState: () => {
        const params = new URLSearchParams(window.location.search);
        console.log("URLUtils: Decoding state from params:", params.toString());
        if (!params.has('mode') && !params.has('g')) {
            console.log("URLUtils: No relevant params found.");
            return null;
        }
        
        const state = {
            mode: params.get('mode') || 'mix',
            gender: params.get('g') || 'male',
            mannequinVisible: params.get('mv') === '1',
            fadeEnabled: params.get('fe') === '1',
            shadowsEnabled: params.get('se') === '1',
            shadowIntensity: parseFloat(params.get('si')) || 1.0,
            mix: {
                top: params.get('top'),
                bottom: params.get('bottom'),
                jacket: params.get('jacket')
            },
            dress: {
                comboId: params.get('combo')
            },
            colors: {},
            environment: {
                hdr: params.get('hdr'),
                intensity: parseFloat(params.get('hi')),
                rotation: parseFloat(params.get('hr')) || 0,
                bg360Url: null
            }
        };

        ['top', 'bottom', 'jacket', 'dress', 'mannequin', 'background'].forEach(cat => {
            if (params.has(`${cat}_c`)) state.colors[cat] = '#' + params.get(`${cat}_c`);
        });

        if (params.has('bg')) state.colors.background = '#' + params.get('bg');

        return state;
    }
};
