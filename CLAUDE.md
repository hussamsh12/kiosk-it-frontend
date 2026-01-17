# CLAUDE.md - Frontend Context

## Project: tabletop-customer

Next.js 14+ web application for customer self-service ordering, supporting kiosk tablets, hybrid native shells, and QR code phone ordering.

## Tech Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- Zustand for state management

## Key Architecture

- **Multi-tenant**: Subdomain routing (`tenant.kiosk.domain.com`)
- **Display Modes**: `kiosk` (tablet, 64px targets) and `qr` (phone, 44px targets)
- **Order Sources**: KIOSK (with optional employee) or QR_TABLE (no employee)

## Folder Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Store selection (redirects if store selected)
│   ├── globals.css         # Tailwind + display mode styles
│   └── store/[storeSlug]/  # Store-specific routes (slug from store name)
│       ├── layout.tsx      # Store layout with header + cart
│       ├── page.tsx        # Redirects to menu
│       ├── menu/page.tsx   # Menu browsing
│       ├── checkout/page.tsx # Checkout with order notes
│       └── order/[orderId]/page.tsx # Order confirmation
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Layout components
│   │   ├── header.tsx      # Header with logo + cart button
│   │   └── cart-sidebar.tsx # Cart sheet component
│   ├── menu/               # Menu components
│   │   ├── category-list.tsx   # Horizontal category navigation
│   │   ├── item-card.tsx       # Single menu item card
│   │   ├── item-grid.tsx       # Grid of item cards
│   │   ├── item-detail-modal.tsx # Item customization dialog
│   │   ├── variant-selector.tsx  # Size/variant selection
│   │   ├── modifier-group.tsx    # Modifier checkboxes/radios
│   │   └── quantity-selector.tsx # +/- quantity control
│   └── checkout/           # Checkout components
│       ├── checkout-form.tsx   # Order notes input
│       ├── order-summary.tsx   # Cart summary for checkout
│       └── place-order-button.tsx # Submit order button
├── hooks/                  # Custom React hooks
│   ├── use-session.ts      # Session data hook
│   ├── use-cart.ts         # Cart operations hook
│   └── use-mode.ts         # Display mode hook
├── lib/
│   ├── api/                # API client and endpoints
│   │   ├── client.ts       # Base API client with token refresh
│   │   ├── auth.ts         # Auth endpoints
│   │   ├── menu.ts         # Menu endpoints
│   │   ├── orders.ts       # Order endpoints
│   │   └── stores.ts       # Store endpoints
│   └── utils.ts            # Utility functions (cn)
├── providers/
│   ├── session-provider.tsx  # Session initialization
│   ├── branding-provider.tsx # Tenant branding CSS vars
│   └── index.tsx             # Combined providers
├── stores/                 # Zustand stores
│   ├── session-store.ts    # Tenant, store, auth state
│   ├── cart-store.ts       # Cart items and totals
│   └── ui-store.ts         # Display mode, modals
└── types/
    └── index.ts            # TypeScript type definitions
```

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
NEXT_PUBLIC_DEFAULT_TENANT=demo
```

## State Management (Zustand)

### Session Store
- `tenantSlug`, `tenant` - Current tenant info
- `selectedStoreId`, `selectedStore` - Selected store
- `employeeId`, `employeeName` - For KIOSK mode
- `accessToken`, `refreshToken` - JWT auth
- Persisted to localStorage

### Cart Store
- `items` - Cart items with modifiers
- `subtotal`, `taxAmount`, `total` - Calculated totals
- `taxRate` - From store settings (default 17%)
- Persisted to localStorage

### UI Store
- `displayMode` - 'kiosk' or 'qr'
- `selectedCategoryId` - Menu navigation
- `isItemModalOpen`, `selectedItemId` - Item detail modal
- `isCartOpen` - Cart sidebar (kiosk)
- Not persisted

## Display Modes

| Mode | Screen | Touch Target | Font Size |
|------|--------|--------------|-----------|
| kiosk | >= 768px | 64px | 18px |
| qr | < 768px | 44px | 16px |

CSS data attribute: `[data-mode="kiosk"]` or `[data-mode="qr"]`

## API Integration

### Headers
- `X-Tenant-ID`: Set from session store
- `X-Employee-ID`: Set for KIOSK mode only
- `Authorization`: Bearer token (auto-refresh on 401)

### Key Endpoints
- `GET /categories/menu` - Full menu
- `GET /items/{id}/details` - Item with modifiers
- `POST /orders` - Create order (source: KIOSK or QR_TABLE)
- `GET /orders/{id}` - Order status
- `GET /stores/active/brief` - Store list
- `GET /tenants/slug/{slug}` - Tenant info

## Running Locally

```bash
npm install
npm run dev     # Start dev server on :3000
npm run build   # Production build
npm run lint    # ESLint
```

Access with tenant: `http://localhost:3000?tenant=demo`

## Implemented (Phase 1 - Foundation)

- [x] Next.js project with TypeScript + Tailwind
- [x] shadcn/ui components (button, card, sheet, dialog, etc.)
- [x] Subdomain middleware
- [x] API client with token refresh
- [x] Zustand stores (session, cart, ui)
- [x] Session provider (auto-init)
- [x] Branding provider (CSS vars)
- [x] Display mode detection
- [x] Custom hooks (useSession, useCart, useDisplayMode)

## Implemented (Phase 2 - Layout & Navigation)

- [x] Header component (logo, cart button with badge)
- [x] CartSidebar component (sheet with item list, totals)
- [x] Store selection page (fetches stores, auto-selects single store)
- [x] Store layout with header + cart sidebar
- [x] Route structure: `/` → `/store/[storeSlug]/menu`
- [x] Utility functions (formatCurrency, formatRelativeTime)

## Implemented (Phase 3 - Menu)

- [x] CategoryList - Horizontal scrolling category navigation
- [x] ItemCard - Menu item with image, name, price, "Customize" badge
- [x] ItemGrid - Responsive grid of ItemCards with loading skeleton
- [x] ItemDetailModal - Full customization dialog with:
  - Image header with close button
  - VariantSelector - Radio-style size/variant picker
  - ModifierGroupSelector - Checkbox/radio modifier selection
  - QuantitySelector - +/- quantity control
  - Special instructions input
  - "Add to Cart" button with total price
- [x] Menu page integration with API fetching and category filtering
- [x] Toast notifications on add to cart

## Implemented (Phase 4 - Checkout & Orders)

- [x] CheckoutForm component - order notes input
- [x] OrderSummary component - item list and totals
- [x] PlaceOrderButton - order creation with loading state
- [x] Checkout page (`/store/[storeSlug]/checkout`)
- [x] Order confirmation page (`/store/[storeSlug]/order/[orderId]`)
- [x] Order status polling (10s interval)
- [x] Cart sidebar checkout navigation
- [x] Order source based on display mode (KIOSK/QR_TABLE)

## Implemented (Phase 5-6 - Polish)

- [x] Error boundary component (`components/error-boundary.tsx`)
- [x] Global error page (`app/error.tsx`)
- [x] Store-level error page (`app/store/[storeSlug]/error.tsx`)
- [x] Global loading page (`app/loading.tsx`)
- [x] Store-level loading skeleton (`app/store/[storeSlug]/loading.tsx`)
- [x] Not found page (`app/not-found.tsx`)
- [x] Accessibility improvements:
  - ItemCard: keyboard navigation, ARIA labels, focus states
  - QuantitySelector: aria-live announcements, button labels
  - CategoryList: tab navigation, aria-selected states
  - Focus visible outlines on interactive elements

## Future Enhancements

- [ ] WebSocket for real-time order status updates
- [ ] Employee login for KIOSK mode
- [ ] Customer account/loyalty integration
- [ ] Payment integration
- [ ] Receipt printing support

## Notes

- Viewport locked: no zoom, viewport-fit: cover
- Kiosk mode disables text selection
- Safe area padding for notched devices
- Toast notifications via Sonner
