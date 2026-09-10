export const AnimationUtils = {
    lerp: (start, end, amt) => {
        return (1 - amt) * start + amt * end;
    },
    
    easeOutQuart: (x) => {
        return 1 - Math.pow(1 - x, 4);
    }
};
