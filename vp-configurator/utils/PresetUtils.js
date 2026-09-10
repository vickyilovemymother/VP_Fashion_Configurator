export const PresetUtils = {
    savePreset: (state) => {
        const data = JSON.stringify(state);
        localStorage.setItem('vp_config_preset', data);
        return data;
    },
    
    loadPreset: () => {
        const data = localStorage.getItem('vp_config_preset');
        return data ? JSON.parse(data) : null;
    }
};
