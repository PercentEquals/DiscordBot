export default async function sleep(timems: number) {
    await new Promise((resolve) => {
        setTimeout(resolve, timems);
    })
}