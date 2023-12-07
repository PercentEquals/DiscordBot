export function getRange(range: string | null) {
    if (!range) return [];

    const ranges = range.split(',');
    const rangeArray = [] as number[];

    ranges.forEach((range) => {
        range = range.trim();

        if (range.includes('-')) {
            const [start, end] = range.split('-');
            for (let i = parseInt(start); i <= parseInt(end); i++) {
                rangeArray.push(i);
            }
        } else {
            rangeArray.push(parseInt(range));
        }
    });

    return rangeArray;
}