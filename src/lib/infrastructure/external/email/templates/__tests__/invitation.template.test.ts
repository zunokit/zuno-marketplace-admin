/**
 * Invitation Email Template Tests
 * Test email template generation
 */

import { invitationEmailTemplate } from '../invitation.template'

describe('Invitation Email Template', () => {
  const defaultProps = {
    inviterName: 'John Doe',
    organizationName: 'Test Organization',
    role: 'viewer',
    invitationUrl: 'https://example.com/invite/accept?id=123&token=abc',
    expiresInDays: 7,
  }

  describe('invitationEmailTemplate', () => {
    it('should generate email with all required fields', () => {
      const { html, text, subject } = invitationEmailTemplate(defaultProps)

      expect(html).toBeDefined()
      expect(text).toBeDefined()
      expect(subject).toBeDefined()

      expect(subject).toContain('Test Organization')
    })

    it('should include inviter name in HTML', () => {
      const { html } = invitationEmailTemplate(defaultProps)
      expect(html).toContain('John Doe')
    })

    it('should include organization name in HTML', () => {
      const { html } = invitationEmailTemplate(defaultProps)
      expect(html).toContain('Test Organization')
    })

    it('should include role in HTML', () => {
      const { html } = invitationEmailTemplate(defaultProps)
      expect(html).toContain('viewer')
    })

    it('should include invitation URL in HTML', () => {
      const { html } = invitationEmailTemplate(defaultProps)
      expect(html).toContain(defaultProps.invitationUrl)
    })

    it('should include expiration days in HTML', () => {
      const { html } = invitationEmailTemplate(defaultProps)
      expect(html).toContain('7 days')
    })

    it('should handle singular day correctly', () => {
      const { html } = invitationEmailTemplate({
        ...defaultProps,
        expiresInDays: 1,
      })
      expect(html).toContain('1 day')
      expect(html).not.toContain('1 days')
    })

    it('should include role descriptions', () => {
      const roles = ['owner', 'admin', 'editor', 'viewer'] as const

      roles.forEach((role) => {
        const { html } = invitationEmailTemplate({
          ...defaultProps,
          role,
        })
        expect(html).toContain(role)
      })
    })

    it('should generate valid HTML with proper structure', () => {
      const { html } = invitationEmailTemplate(defaultProps)

      // Check HTML structure
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html')
      expect(html).toContain('<head>')
      expect(html).toContain('<body>')
      expect(html).toContain('</html>')

      // Check email button
      expect(html).toContain('Accept Invitation')
      expect(html).toContain('class="email-button"')
    })

    it('should generate plain text version', () => {
      const { text } = invitationEmailTemplate(defaultProps)

      expect(text).toContain('John Doe')
      expect(text).toContain('Test Organization')
      expect(text).toContain('viewer')
      expect(text).toContain(defaultProps.invitationUrl)
      expect(text).not.toContain('<')
      expect(text).not.toContain('>')
    })

    it('should handle invitee name when provided', () => {
      const { html, text } = invitationEmailTemplate({
        ...defaultProps,
        inviteeName: 'Jane Smith',
      })

      expect(html).toContain('Hi Jane Smith')
      expect(text).toContain('Hi Jane Smith')
    })

    it('should use default greeting when invitee name not provided', () => {
      const { html, text } = invitationEmailTemplate(defaultProps)

      expect(html).toContain('Hi there')
      expect(text).toContain('Hi there')
    })

    it('should generate appropriate subject line', () => {
      const { subject } = invitationEmailTemplate(defaultProps)
      expect(subject).toBe("You're invited to join Test Organization")
    })

    it('should include role-specific descriptions', () => {
      const ownerTemplate = invitationEmailTemplate({
        ...defaultProps,
        role: 'owner',
      })
      expect(ownerTemplate.html).toContain('full access')

      const adminTemplate = invitationEmailTemplate({
        ...defaultProps,
        role: 'admin',
      })
      expect(adminTemplate.html).toContain('manage members')

      const editorTemplate = invitationEmailTemplate({
        ...defaultProps,
        role: 'editor',
      })
      expect(editorTemplate.html).toContain('view and edit')

      const viewerTemplate = invitationEmailTemplate({
        ...defaultProps,
        role: 'viewer',
      })
      expect(viewerTemplate.html).toContain('read-only')
    })

    it('should include security notice', () => {
      const { html, text } = invitationEmailTemplate(defaultProps)

      expect(html).toContain('did not expect this invitation')
      expect(text).toContain('did not expect this invitation')
    })
  })
})
