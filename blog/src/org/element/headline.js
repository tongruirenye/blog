// headline
// STARS KEYWORD PRIORITY TITLE TAGS


const KEYWORD_STATE = 1; // KEYWORD
const KEYWORD_PRIORITY = 2; // PRIORITY


export default function(ctx, start, end, indent) {
    if (indent != 0) {
        return null;
    }

    if (input.charCodeAt(start) !== 0x2a) {
        return null;
    }

    let level = 0;

    for (let i = start; i < end; i++) {
        code = input.charCodeAt(i);
        if (code === 0x2a) {
            level++;
            continue;
        } else if (code === 0x20) {
            return {kind:}
        } else {
            break;
        }
    }

    return null;
}