const puppeteer = require("puppeteer");

async function scrapeStore(item) {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
    const page = await browser.newPage()
    await page.goto('https://solarisjapan.com/')
    await page.click('#header > div.header__content > div > div.mobile-navbar.wrapper.large-up--hide.tw-flex.tw-justify-between.tw-items-center > ul > li:nth-child(1) > a')
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.type('#header > div.header__content > div > div.mobile-navbar.wrapper.large-up--hide.tw-flex.tw-justify-between.tw-items-center > div > div > form > input',
            item)
    ])

    const searchResult = await page.evaluate(() => {
        const lst = []
        const collection = document.getElementById('SearchContainer').getElementsByClassName('product__item hover:tw-shadow-lg')
        for (var i = 0; i < collection.length; i++) {
            try {
                const temp = []
                console.log(collection[i].querySelector('.title.tw-mx-0.tw-my-4.tw-text-base.tw-font-normal.tw-text-black').innerHTML)
                console.log(collection[i].querySelector('.money').innerHTML)
                temp.push(collection[i].querySelector('.title.tw-mx-0.tw-my-4.tw-text-base.tw-font-normal.tw-text-black').innerHTML)
                temp.push(collection[i].querySelector('.money').innerHTML)
                temp.push('SolarisJapan')
                temp.push(collection[i].querySelector('.product-link').href)

                lst.push(temp)
            }
            catch (err) {
                console.log("Has no price")
            }
        }
        return lst
    }
    )
    console.log('done')
    return searchResult
}
module.exports = {
    scrapeStore
}
