// headline

export default function(input, start, end, indent) {
    if (indent != 0) {
        return false;
    }

    if (input.charCodeAt(start) !== 0x2a) {
        return false;
    }

    let level = 0;
    let mark = -1;
    let code;
    let isHeadline = false;
    let mark = {
        pos: 0,
        tag: "abc"
    }
    for (let i = start; i < end; i++) {
        code = input.charCodeAt(i);
        if (isHeadline) {
            if (mark.tag == 1) {
                if (code === 0x20) {
                    let keyword = input.substring(mark.pos + 1, i);
                    if (keyword) {
                        mark.tag = 2
                    } else {
                        mark.tag = 3
                    }
                }
            }
            if (code === 0x20) {
                if (mark.tag == 1) {

                }
            } else if (code === 0x5b) {

            } else if (code === 0x5d) {

            } else if (code === 0x3a) {

            }
        } else {
            if (code === 0x2a) {
                level++;
                continue;
            } else if (code === 0x20) {
                isHeadline = true;
                mark.pos = i
                mark.tag = "keyword"
            } else {
                break;
            }
        }
    }

    if (!isHeadline) {
        return false;
    }
    
    let headline = this.input.substring(start, end).match(this.rule.HeadlineRe());
    if (headline == null) {
        return false;
    }
    
    this.createBlock(start, end, BlockKind.BlockHeadline, {
        level: level,
        todo: headline[2],
        priority: headline[3],
        title: headline[4],
        tag: headline[5]
    });
    
    return true;
}