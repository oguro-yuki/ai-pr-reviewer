export function getMultilineString(input: string): string[] {
    return input
        .split('\n')
        .filter(x => x !== '');
}