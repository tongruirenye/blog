import Rule from "./rule";

test("test", ()=> {
    console.log(Rule.HeadlineRe());
    expect("* BLOG hello".match(Rule.HeadlineRe())).toBe(["* BLOG hello", "*", "BLOG", undefined, "hello", undefined]);
});