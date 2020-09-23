
export default {

    IsBlank: function(char) {
        return ((char === '\t') || (char === ' '));
    },

    IsNewline: function(char) {
        return ((char === '\r') || (char === '\n'));
    },

    TodoKeywords: ["BLOG", "NOTE", "READING", "EVENT"],
    ClosedRe: /CLOSED: *[\[<]([^\]>]+)[\]>]/,
    DeadlineRe: /DEADLINE: *[\[<]([^\]>]+)[\]>]/,
    ScheduledRe: /SCHEDULED: *[\[<]([^\]>]+)[\]>]/,
    ClockInRe: /CLOCK: *[\[<]([^\]>]+)[\]>]/,
    ClockOutRe: /CLOCK: *[\[<]([^\]>]+)[\]>]--[\[<]([^\]>]+)[\]>][ \t]*=>[ \t]*([0-9]{1,2}):([0-9]{1,2})[ \t]*$/,
    DrawerRe: /^[ \t]*:(.*?):(?:[ \t]+(.*?))?[ \t]*$/,

    HeadlineRe: function() {
        if (this.headlineRe) {
            return this.headlineRe;
        }
        let todos = this.TodoKeywords.join("|");
        this.headlineRe = new RegExp(`^(\\*+)(?: +(${todos}))?(?: +(\\[#.\\]))?(?: +(.*?))??(?:[ \\t]+(:[\\w_@#%:]+:))?[ \\t\\n]*$`);
        return this.headlineRe;
    },

    IsClock: function(keyword) {
	    return keyword === "CLOCK";
    },

    IsPlanning: function(keyword) {
	    if (keyword === "DEADLINE" || keyword === "SCHEDULED" || keyword === "CLOSED") {
	        return true;
	    }
	    return false;
    },

    ScheduledCharCodeArray: [0x53, 0x43, 0x48, 0x45, 0x44, 0x55, 0x4c, 0x45, 0x44],
    DeadlineCharCodeArray: [0x44, 0x45, 0x41, 0x44, 0x4c, 0x49, 0x4e, 0x45],
    ClosedCharCodeArray: [0x43, 0x4c, 0x4f, 0x53, 0x45, 0x44]
}