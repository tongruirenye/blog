import Rule from './rule.js';
import BlockKind from './block.js';

export class Lexer {
    constructor() {
        this.elementRules = []
        this.objectRules = []
        this.elementRules.push(this.parseEmpty);
        this.elementRules.push(this.parseHeadline);
	    this.elementRules.push(this.parseList);
	    this.elementRules.push(this.parseTable);
        this.elementRules.push(this.parseFootnote);
	    this.elementRules.push(this.parseComment);
	    this.elementRules.push(this.parseKeyword);
	    this.elementRules.push(this.parseFixedWidthAreas);
	    this.elementRules.push(this.parseDrawers);
	    this.elementRules.push(this.parseHorizontal);
	    this.elementRules.push(this.parseClock);
	    this.elementRules.push(this.parsePlanning);
	    this.elementRules.push(this.parseParagraph);
    }

    parse(input) {
        let start = 0;
        let position = 0;
        let indent = 0;
        let indentFound = false;
        this.input = input;
        this.output = [];

        for (const char of input) {
            position += char.length;

            if (!indentFound) {
                if (Rule.IsBlank(char)) {
                    if (char === '\t') {
                        indent = (indent + 4) & ~3;
                    } else {
                        indent++;
                    }
                    continue
                }
                indentFound = true;
            }

            if (char === '\n') {
                this.parseLine(start, position - char.length, indent);

                start = position;
                indent = 0;
                indentFound = false;
            }
        }

        if (start < position) {
            this.parseLine(start, position, indent);
        }

        return this.output;
    }

    parseLine(start, end, indent) {
        for (let i = 0; i < this.elementRules.length; i++) {
            if (this.elementRules[i].call(this, start, end, indent)) {
                break;
            }
        }
    }

    processLine() {
        
    }

    createBlock(start, end, kind, attrs) {
	    attrs || (attrs = {});
	    _.extend(attrs, {kind: kind, text: this.input.substring(start, end)});
        this.output.push(attrs);
    }

    parseEmpty(start, end, indent) {
        if (start == end) {
            this.createBlock(start, end, BlockKind.BlockParagraph);
            return true;
        }
        return false;
    }

    parseHeadline(start, end, indent) {
        if (indent != 0) {
            return false;
        }

        if (this.input.charCodeAt(start) !== 0x2a) {
            return false;
        }

        let level = 0;
        let mark = -1;
        let code;
        for (let i = start; i < end; i++) {
            code = this.input.charCodeAt(i);
            if (code === 0x2a) {
                level++;
		        continue;
            } else if (code === 0x20) {
                mark = i - start;
            }
	        break;
        }

        if (mark == -1) {
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

    parseList(start, end, indent) {
	    let mark = start + indent;
	    if (this.input.charCodeAt(mark) === 0x2d ||
	        this.input.charCodeAt(mark) === 0x2b) {
	        if (end - mark < 2) {
		        return false;
	        }
	        if (this.input.charCodeAt(mark + 1) === 0x20) {
		        this.createBlock(start, end, BlockKind.BlockList, {
		            "level": indent,
		            "bullet": this.input.substring(mark, mark + 1),
		        });
		        return true;
	        }

	        return false;
	    }
	    
	    if (this.input.charCodeAt(mark) >= 0x31 &&
	        this.input.charCodeAt(mark) <= 0x39) {
	        let code = null;
	        for (let i = mark + 1; i < end; i++) {
		        if (this.input.charCodeAt(i) >= 0x31 &&
		            this.input.charCodeAt(i) <= 0x39) {
		            continue;
		        } else if (this.input.charCodeAt(i) === 0x20) {
		            if (code) {
			            this.createBlock(start, end, BlockKind.BlockList, {
			                "level": indent,
			                "bullet": code,
			            });
			            return true;
		            }
		            break;
		        } else if (this.input.charCodeAt(i) === 0x2e) {
		            code = this.input.substring(mark, i + 1);
		        } else if (this.input.charCodeAt(i) === 0x29) {
		            code = this.input.substring(mark, i + 1);
		        } else {
		            break;
		        }
	        }
	    }

	    return false;
    }

    parseTable(start, end, indent) {
	    let mark = start + indent;
	    if (this.input.charCodeAt(mark) !== 0x7c) {
	        return false;
	    }


	    if (mark + 1 === end) {
	        this.createBlock(start, end, BlockKind.BlockTable, {
		        type: "data",
		        columns: [],
	        });
	        return true;
	    }

	    // table row
	    if (this.input.charCodeAt(mark + 1) === 0x2d) {
	        this.createBlock(start, end, BlockKind.BlockTable, {
		        type: "row"
	        });
	        return true;
	    }

	    // row content
	    let firstPos = mark + 1;
	    let columns = [];
        let foundNoSpace = false;
	    for (let i = mark + 1; i <= end; i++) {
	        if (i == end) {
                if (foundNoSpace) {
                     columns.push(this.input.substring(firstPos, i));
                }
		        break;
	        }
	        
	        if (this.input.charCodeAt(i) === 0x7c) {
		        columns.push(this.input.substring(firstPos, i));
		        firstPos = i + 1;
                foundNoSpace = false;
	        } else if (this.input.charCodeAt(i) !== 0x09 &&
                       this.input.charCodeAt(i) !== 0x20) {
                foundNoSpace = true;
            }
	    }

	    this.createBlock(start, end, BlockKind.BlockTable, {
	        type: "data",
	        columns: columns
	    });
	    
	    return true;
    }

    parseFootnote(start, end, indent) {
        if (indent != 0) {
            return false;
        }

	    let mark = start + indent;
        if (this.input.charCodeAt(mark) !== 0x5b) {
            return false;
        }

        if (end - mark < 4) {
            return false;
        }

        if (this.input.charCodeAt(mark + 1) !== 0x66) {
            return false;
        }

        if (this.input.charCodeAt(mark + 2) !== 0x6e) {
            return false;
        }

        let footnote = this.input.substring(start, end).match(/\[fn:([-_\w]*)\]/);
        if (footnote == null) {
            return false;
        }
	    
	    this.createBlock(start, end, BlockKind.BlockFootnote, {
	        "label": footnote[1],
	    });
	    
        return true;
    }

    parseComment(start, end, indent) {
	    let mark = start + indent;
	    
        if (this.input.charCodeAt(mark) !== 0x23) {
            return false;
        }

        // #\n
        if (end - start == 1) {
	        this.createBlock(start, end, BlockKind.BlockComment);
            return true;
        }
        // # comment
        if (this.input.charCodeAt(mark + 1) !== 0x20) {
            return false;
        }

	    this.createBlock(start, end,  BlockKind.BlockComment);
        return true;
    }

    parseKeyword(start, end, indent) {
	    let mark = start + indent;
        if (end - mark < 2) {
            return false;
        }

        if (this.input.charCodeAt(mark) !== 0x23) {
            return false;
        }

        if (this.input.charCodeAt(mark + 1) !== 0x2b) {
            return false;
        }

        // #+BEGIN_NAME
        if (end - mark > 8) {
            if (this.input.charCodeAt(mark + 2) === 0x42 &&
                this.input.charCodeAt(mark + 3) === 0x45 &&
                this.input.charCodeAt(mark + 4) === 0x47 &&
                this.input.charCodeAt(mark + 5) === 0x49 &&
                this.input.charCodeAt(mark + 6) === 0x4e &&
                this.input.charCodeAt(mark + 7) === 0x5f) {
                let block = this.input.substring(start, end).match(/#\+(?:BEGIN_)(\S+)[ \t]*/);
                if (block != null) {
	                this.createBlock(start, end, BlockKind.BlockBlock, {
                        "type": "BEGIN",
		                "name": block[1]
	                });
                    return true;
                }
            }
        }

        if (end - mark > 6) {
            if (this.input.charCodeAt(mark + 2) === 0x45 &&
                this.input.charCodeAt(mark + 3) === 0x4e &&
                this.input.charCodeAt(mark + 4) === 0x44 &&
                this.input.charCodeAt(mark + 5) === 0x5f) {
                let block = this.input.substring(start, end).match(/#\+(?:END_)(\S+)[ \t]*/);
                if (block != null) {
	                this.createBlock(start, end, BlockKind.BlockBlock, {
                        "type": "END",
		                "name": block[1]
	                });
                    return true;
                }
            }
        }

	    if (end - mark < 3) {
	        return false;
	    }

	    if (this.input.charCodeAt(mark + 2) === 0x20 ||
	        this.input.charCodeAt(mark + 2) === 0x09) {
	        return false;
	    }
	    
        // #+keyword:
        let keyword = this.input.substring(start, end).match(/#\+(\S+):[ \t]*/);
        if (keyword != null) {
	        this.createBlock(start, end, BlockKind.BlockKeyword, {
		        "name": keyword[1]
	        });
            return true;
        }

        return false;
    }

    parseFixedWidthAreas(start, end, indent) {
	    let mark = start + indent;
        if (this.input.charCodeAt(mark) !== 0x3a) {
            return false;
        }

        if (end - mark == 1) {
	        this.createBlock(start, end, BlockKind.BlockFixedWidthAreas);
            return true;
        }

        if (this.input.charCodeAt(mark + 1) === 0x20) {
	        this.createBlock(start, end, BlockKind.BlockFixedWidthAreas);
            return true;
        }

        return false;
    }

    parseDrawers(start, end, indent) {
	    let mark = start + indent;
	    if (end - mark < 2) {
	        return false;
	    }
	    
        if (this.input.charCodeAt(mark) !== 0x3a) {
            return false;
        }

	    if (this.input.charCodeAt(mark + 1) === 0x20 ||
	        this.input.charCodeAt(mark + 1) === 0x09) {
	        return false;
	    }
        
        let drawer = this.input.substring(start, end).match(/:([-_\w]+):[ \t]*(.*)+[ \t]*?/);
        if (drawer == null) {
            return false;
        }

	    this.createBlock(start, end, BlockKind.BlockDrawer, {
	        name: drawer[1],
            val: drawer[2]
	    });

        return true;
    }

    parseHorizontal(start, end, indent) {
	    let mark = start + indent;
        if (end - mark < 5) {
            return false;
        }

        for (let i = mark; i < end; i++) {
            if (this.input.charCodeAt(i) !== 0x2d) {
                return false;
            }
        }

	    this.createBlock(start, end, BlockKind.BlockHorizontal);
	    
        return true;
    }

    parseClock(start, end, indent) {
        let mark = start + indent;
        if (end - mark < 6) {
            return false;
        }

	    if (this.input.charCodeAt(mark + 5) !== 0x3a) {
	        return false;
	    }

        if (this.input.charCodeAt(mark) !== 0x43 &&
            this.input.charCodeAt(mark + 1) !== 0x4c &&
            this.input.charCodeAt(mark + 2) !== 0x4f &&
            this.input.charCodeAt(mark + 3) !== 0x4c &&
            this.input.charCodeAt(mark + 4) !== 0x4b) {
            return false;
        }

        let clockString = this.input.substring(start, end);
        let clockOut = clockString.match(this.rule.ClockOutRe);
        if (clockOut != null) {
            this.createBlock(start, end, BlockKind.BlockClock, {
                timein: clockOut[1],
                timeout: clockOut[2],
                timeHour: clockOut[3],
                timeMinute: clockOut[4]
            });

            return true;
        }

        let clockIn = clockString.match(this.rule.ClockInRe);
        if (clockIn != null) {
            this.createBlock(start, end, BlockKind.BlockClock, {
                timein: clockIn[1],
                timeout: null,
                timeHour: null,
                timeMinute: null
            });

            return true;
        }
        

        return false;
    }

    parsePlanning(start, end, indent) {
        let mark = start + indent;
        if (end - mark < 7) {
            return false;
        }

        let isPlanning = true;
	    if (this.input.charCodeAt(mark + 6) === 0x3a) {
            for (let i = mark; i < mark + 6; i++) {
                if (this.input.charCodeAt(i) !== this.rule.ClosedCharCodeArray[i - mark]) {
                    isPlanning = false;
                    break;
                }
            }
	    } else {
            isPlanning = false;
        }

        if (!isPlanning) {
            isPlanning = true;
            if (end - mark >= 10) {
                if (this.input.charCodeAt(mark + 9) === 0x3a) {
                    for (let i = mark; i < mark + 9; i++) {
                        if (this.input.charCodeAt(i) !== this.rule.ScheduledCharCodeArray[i - mark]) {
                            isPlanning = false;
                            break;
                        }
                    }
                }
            } else {
                isPlanning = false;
            }
        }

        if (!isPlanning) {
            isPlanning = true;
            if (end - mark >= 9) {
                if (this.input.charCodeAt(mark + 8) === 0x3a) {
                    for (let i = mark; i < mark + 8; i++) {
                        if (this.input.charCodeAt(i) !== this.rule. DeadlineCharCodeArray[i - mark]) {
                            isPlanning = false;
                            break;
                        }
                    }
                }
            } else {
                isPlanning = false;
            }
        }

        if (!isPlanning) {
            return false;
        }

        isPlanning = false;
        let planningString = this.input.substring(start, end);

        let closedPlanning = planningString.match(this.rule.ClosedRe);
        if (closedPlanning != null) {
            isPlanning = true;
            this.createBlock(start, end, BlockKind.BlockPlanning, {
                type: "CLOSED",
                time: closedPlanning[1]
            });
        }

        let scheduledPlanning = planningString.match(this.rule.ScheduledRe);
        if (scheduledPlanning != null) {
            isPlanning = true;
            this.createBlock(start, end, BlockKind.BlockPlanning, {
                type: "SCHEDULED",
                time: scheduledPlanning[1]
            });
        }

        let deadPlanning = planningString.match(this.rule.DeadlineRe);
        if (deadPlanning != null) {
            isPlanning = true;
            this.createBlock(start, end, BlockKind.BlockPlanning, {
                type: "DEADLINE",
                time: deadPlanning[1]
            });
        }

	    return isPlanning;
    }
    

    parseParagraph(start, end, indent) {
        this.createBlock(start, end, BlockKind.BlockParagraph);
    }

    
}
