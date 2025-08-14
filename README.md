This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Project Architecture

### Notification System

The notification system has been completely redesigned with modern React patterns, comprehensive type safety, and enhanced user experience:

#### 🏗️ Architecture Overview

The notification system follows a modular, scalable architecture with clear separation of concerns:

```
src/
├── app/dashboard/notifications/          # Main notification pages
├── components/notifications/             # Notification UI components
├── contexts/notification-context.tsx    # Global notification state
├── hooks/use-notification-settings.ts   # Settings management
├── lib/notification-constants.ts        # Centralized constants
├── lib/notification-utils.ts           # Utility functions
└── types/notifications.ts              # TypeScript definitions
```

#### 🎯 Key Features

- **Comprehensive Notification Center**: Tabbed interface with overview, management, testing, and settings
- **Real-time Updates**: Live notification delivery with Convex integration
- **Advanced Filtering**: Search, filter by type/priority/status, and date ranges
- **Bulk Operations**: Select multiple notifications for batch actions
- **Testing Suite**: Built-in notification testing with preset and custom options
- **Browser Notifications**: Native browser notification support with permission management
- **Responsive Design**: Mobile-friendly interface with dark mode support

#### 🧩 Core Components

- **NotificationTest** (`/components/notifications/notification-test.tsx`): Enhanced testing interface with preset and custom notifications
- **NotificationManagement** (`/components/notifications/notification-management.tsx`): Comprehensive notification management with filtering and bulk operations
- **NotificationStats** (`/components/notifications/notification-stats.tsx`): Real-time statistics dashboard
- **NotificationDropdown** (`/components/notifications/notification-dropdown.tsx`): Header notification dropdown with live updates

#### 🔧 Custom Hooks & Utilities

- **useNotificationSettings** (`/hooks/use-notification-settings.ts`): Manages user notification preferences with localStorage persistence
- **useNotificationContext** (`/contexts/notification-context.tsx`): Global notification state with enhanced error handling
- **Notification Utils** (`/lib/notification-utils.ts`): Comprehensive utility functions for formatting, sorting, and validation
- **Notification Constants** (`/lib/notification-constants.ts`): Centralized configuration for types, priorities, and settings

#### 📊 Type Safety & Performance

- **Complete TypeScript Coverage**: Comprehensive interfaces and type definitions
- **Performance Optimizations**: Memoized components, efficient state management, and lazy loading
- **Error Handling**: Robust error boundaries with user-friendly feedback
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

#### 🎨 User Experience Enhancements

- **Loading States**: Skeleton loaders and progress indicators
- **Toast Notifications**: Real-time feedback for user actions
- **Bulk Selection**: Efficient multi-selection with keyboard shortcuts
- **Advanced Search**: Real-time search with debouncing
- **Priority Indicators**: Visual priority system with color coding
- **Date Formatting**: Human-readable time stamps and relative dates

#### 🔒 Security & Validation

- **Input Validation**: Client-side validation with comprehensive error messages
- **Permission Checks**: Role-based access control integration
- **Data Sanitization**: Secure handling of notification content
- **Rate Limiting**: Built-in protection against notification spam

#### 📱 Browser Integration

- **Native Notifications**: Browser notification API integration
- **Permission Management**: Graceful permission request handling
- **Offline Support**: Cached notifications for offline viewing
- **PWA Ready**: Service worker compatible for mobile apps

#### 🚀 Benefits

- **Developer Experience**: Clean APIs, comprehensive documentation, and TypeScript support
- **Maintainability**: Modular architecture with clear separation of concerns
- **Scalability**: Efficient state management and optimized rendering
- **User Experience**: Intuitive interface with comprehensive functionality
- **Performance**: Optimized for large notification volumes with virtual scrolling
- **Accessibility**: WCAG compliant with full keyboard and screen reader support

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
