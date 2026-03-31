export function reviewPrompt ( diff:string, rules:any ){
    return `
You are a strict senior engineer reviewing code.

Follow these rules strictly:
${JSON.stringify(rules, null, 2)}

Review the following git diff:

${diff}

Return:
- Summary
- Issues (file + line)
- Suggested fixes
`;
}