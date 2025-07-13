# Toast Notification System Usage

The toast notification system is now available globally across all admin pages via the `Toast` object.

## Basic Usage

```javascript
// Success toast (green, auto-closes after 3 seconds)
Toast.success('Operation completed successfully!');

// Error toast (red, auto-closes after 5 seconds)
Toast.error('Something went wrong!');

// Warning toast (orange, auto-closes after 4 seconds)
Toast.warning('Please check your input');

// Info toast (blue, auto-closes after 4 seconds)
Toast.info('Here is some information');

// Custom duration
Toast.success('Custom message', 1500); // 1.5 seconds
```

## Advanced Usage

```javascript
// Manual control
const toastId = Toast.show('Processing...', 'info', 0); // 0 = no auto-close
// Later...
Toast.hide(toastId);

// Clear all toasts
Toast.clear();
```

## Integration

The toast system is automatically included in all admin pages via the navigation component.

### Files

- `/src/utils/toast.js` - Main toast functionality
- `/src/utils/toast.css` - Toast styling
- Included in `getAdminStyles()` and `getAdminScripts()` in navigation.ts

### Features

- Responsive design (mobile-friendly)
- Dark mode support
- Stacked toasts
- Manual close buttons
- Auto-hide functionality
- Multiple toast types
- Accessible markup

### Migration from Modal.success() for simple messages

```javascript
// Old way
Modal.success('Success', 'User enabled');

// New way (for simple success messages)
Toast.success('User enabled');
```

Keep Modal.success() for complex confirmations that need user interaction, but use Toast for simple notifications.
