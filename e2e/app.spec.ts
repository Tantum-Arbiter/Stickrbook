import { test, expect } from './fixtures/base'

test.describe('StickrBook App', () => {
  test('should display the app header', async ({ appPage }) => {
    await appPage.goto()

    const title = await appPage.getTitle()
    expect(title).toBe('StickrBook')

    const subtitle = await appPage.getSubtitle()
    expect(subtitle).toBe('Grow with Freya')
  })

  test('should increment counter on button click', async ({ appPage }) => {
    await appPage.goto()

    // Initial state
    let count = await appPage.getCountValue()
    expect(count).toBe(0)

    // Click button
    await appPage.clickCountButton()
    count = await appPage.getCountValue()
    expect(count).toBe(1)

    // Click again
    await appPage.clickCountButton()
    count = await appPage.getCountValue()
    expect(count).toBe(2)
  })

  test('should have correct page title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/StickrBook/)
  })
})

