/**
 * Base Email Template
 * Provides consistent styling and layout for all email templates
 */

export interface BaseTemplateProps {
  title: string
  content: string
  footerText?: string
  appName?: string
  appUrl?: string
}

export function baseEmailTemplate(props: BaseTemplateProps): string {
  const {
    title,
    content,
    footerText = 'This is an automated email. Please do not reply to this email.',
    appName = 'Zuno Marketplace Admin',
    appUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  } = props

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 600;
    }
    .email-body {
      padding: 40px 30px;
    }
    .email-content {
      font-size: 16px;
      line-height: 1.6;
      color: #333333;
    }
    .email-button {
      display: inline-block;
      padding: 14px 28px;
      margin: 20px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      transition: transform 0.2s;
    }
    .email-button:hover {
      transform: translateY(-2px);
    }
    .email-footer {
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #666666;
      background-color: #f9f9f9;
      border-top: 1px solid #e0e0e0;
    }
    .email-footer a {
      color: #667eea;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-header {
        padding: 30px 20px;
      }
      .email-header h1 {
        font-size: 24px;
      }
      .email-body {
        padding: 30px 20px;
      }
      .email-button {
        display: block;
        padding: 12px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>${title}</h1>
    </div>
    <div class="email-body">
      <div class="email-content">
        ${content}
      </div>
    </div>
    <div class="email-footer">
      <p>${footerText}</p>
      <p>
        <a href="${appUrl}">${appName}</a>
      </p>
      <p style="font-size: 12px; color: #999999; margin-top: 10px;">
        &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
