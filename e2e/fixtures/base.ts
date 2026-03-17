import { test as base, Page } from '@playwright/test'

// Page Object classes
export class AppPage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto('/')
  }

  async getTitle() {
    return this.page.locator('h1').textContent()
  }

  async getSubtitle() {
    return this.page.locator('.app-header p').textContent()
  }

  async clickCountButton() {
    await this.page.getByRole('button', { name: /count/i }).click()
  }

  async getCountValue() {
    const text = await this.page.getByRole('button', { name: /count/i }).textContent()
    const match = text?.match(/count:\s*(\d+)/i)
    return match ? parseInt(match[1], 10) : 0
  }
}

// Extend base test with fixtures
type Fixtures = {
  appPage: AppPage
}

export const test = base.extend<Fixtures>({
  appPage: async ({ page }, use) => {
    const appPage = new AppPage(page)
    await use(appPage)
  },
})

export { expect } from '@playwright/test'

