# Accessibility Guide (WCAG 2.1 AA Compliance)

## Current Status

**Target**: WCAG 2.1 Level AA Compliance
**Priority**: HIGH (affects all users, legal requirement in many jurisdictions)

## WCAG 2.1 Principles (POUR)

1. **Perceivable** - Information must be presentable to users in ways they can perceive
2. **Operable** - UI components must be operable by all users
3. **Understandable** - Information and UI operation must be understandable
4. **Robust** - Content must be robust enough to work with assistive technologies

---

## Accessibility Checklist

### 1. Keyboard Navigation (Operable)

**Status**: 🔄 In Progress

**Requirements**:
- [ ] All interactive elements accessible via keyboard
- [ ] Visible focus indicators on all focusable elements
- [ ] Logical tab order throughout application
- [ ] Skip navigation links for screen readers
- [ ] Keyboard shortcuts documented (if any)
- [ ] No keyboard traps

**Implementation**:
```tsx
// ✅ Good: Visible focus indicator
<button className="focus:ring-2 focus:ring-blue-500 focus:outline-none">
  Click me
</button>

// ✅ Good: Skip to main content
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// ❌ Bad: No visible focus state
<button className="outline-none">Click me</button>
```

---

### 2. Color Contrast (Perceivable)

**Status**: ⏳ Pending Audit

**Requirements**:
- [ ] Text contrast ratio ≥ 4.5:1 for normal text (14px+)
- [ ] Text contrast ratio ≥ 3:1 for large text (18px+ or 14px+ bold)
- [ ] UI component contrast ratio ≥ 3:1
- [ ] Links distinguishable without relying solely on color

**Tools**:
- Chrome DevTools - Lighthouse Accessibility Audit
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

**Common Issues**:
```css
/* ❌ Bad: Insufficient contrast (gray text on light background) */
.text-gray-400 { color: #9CA3AF; } /* on white background = 2.5:1 ❌ */

/* ✅ Good: Sufficient contrast */
.text-gray-700 { color: #374151; } /* on white background = 5.9:1 ✅ */
```

---

### 3. Alternative Text for Images (Perceivable)

**Status**: 🔄 In Progress

**Requirements**:
- [ ] All images have descriptive alt text
- [ ] Decorative images have empty alt attribute (`alt=""`)
- [ ] Complex images have detailed descriptions
- [ ] Image links describe destination

**Implementation**:
```tsx
// ✅ Good: Descriptive alt text
<Image
  src="/product.jpg"
  alt="Red cotton t-shirt with crew neck, size medium"
  width={400}
  height={400}
/>

// ✅ Good: Decorative image
<Image
  src="/decorative-line.svg"
  alt=""
  width={100}
  height={2}
/>

// ❌ Bad: Generic or missing alt text
<Image src="/product.jpg" alt="product" width={400} height={400} />
```

---

### 4. Form Labels and Instructions (Understandable)

**Status**: 🔄 In Progress

**Requirements**:
- [ ] All form inputs have associated labels
- [ ] Labels are always visible (not just placeholders)
- [ ] Required fields clearly marked
- [ ] Error messages are descriptive and helpful
- [ ] Form validation provides clear feedback

**Implementation**:
```tsx
// ✅ Good: Explicit label association
<label htmlFor="email" className="block mb-2">
  Email Address <span className="text-red-500" aria-label="required">*</span>
</label>
<input
  id="email"
  type="email"
  required
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <p id="email-error" className="text-red-600 mt-1" role="alert">
    Please enter a valid email address
  </p>
)}

// ❌ Bad: Placeholder as label
<input type="email" placeholder="Email" />
```

---

### 5. ARIA Landmarks and Roles (Perceivable, Operable)

**Status**: ⏳ Pending

**Requirements**:
- [ ] Semantic HTML5 elements used where appropriate
- [ ] ARIA landmarks for page regions (navigation, main, complementary)
- [ ] ARIA roles for custom components
- [ ] ARIA states and properties for dynamic content
- [ ] Page has one `<main>` element
- [ ] Page has `<nav>` for navigation

**Implementation**:
```tsx
// ✅ Good: Semantic HTML
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main id="main-content">
  <h1>Page Title</h1>
  <article>
    <h2>Article Title</h2>
  </article>
</main>

<aside aria-label="Related products">
  {/* Sidebar content */}
</aside>

<footer>
  {/* Footer content */}
</footer>

// ✅ Good: Custom button with ARIA
<div
  role="button"
  tabIndex={0}
  aria-pressed={isPressed}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  Toggle
</div>

// ❌ Bad: Divs for everything
<div>
  <div>Navigation</div>
  <div>Content</div>
</div>
```

---

### 6. Heading Structure (Perceivable, Understandable)

**Status**: ⏳ Pending Audit

**Requirements**:
- [ ] Logical heading hierarchy (h1 → h2 → h3)
- [ ] No skipped heading levels
- [ ] One h1 per page
- [ ] Headings describe content accurately

**Implementation**:
```tsx
// ✅ Good: Logical hierarchy
<h1>Product Catalog</h1>
  <h2>Featured Products</h2>
    <h3>Product Name</h3>
  <h2>All Products</h2>
    <h3>Product Name</h3>

// ❌ Bad: Skipped levels
<h1>Page Title</h1>
<h4>Subsection</h4> {/* Skipped h2 and h3 */}
```

---

### 7. Link Purpose (Understandable)

**Status**: 🔄 In Progress

**Requirements**:
- [ ] Link text describes destination
- [ ] No "click here" or "read more" without context
- [ ] External links indicated
- [ ] Links opening in new tabs have warnings

**Implementation**:
```tsx
// ✅ Good: Descriptive link text
<Link href="/products/t-shirt">
  View Red Cotton T-Shirt Details
</Link>

// ✅ Good: External link with indication
<a
  href="https://example.com"
  target="_blank"
  rel="noopener noreferrer"
>
  Visit Example.com <span className="sr-only">(opens in new tab)</span>
  <ExternalLinkIcon className="inline w-4 h-4" aria-hidden="true" />
</a>

// ❌ Bad: Generic link text
<Link href="/products/t-shirt">Click here</Link>
<Link href="/products/t-shirt">Read more</Link>
```

---

### 8. Focus Management (Operable)

**Status**: ⏳ Pending

**Requirements**:
- [ ] Focus moved to newly opened modals/dialogs
- [ ] Focus returned to trigger element on modal close
- [ ] Focus visible at all times
- [ ] Focus doesn't move unexpectedly

**Implementation**:
```tsx
// ✅ Good: Modal focus management
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      modalRef.current?.focus()
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="modal"
    >
      <button onClick={onClose} aria-label="Close dialog">×</button>
      {children}
    </div>
  )
}
```

---

### 9. Error Identification and Suggestions (Understandable)

**Status**: 🔄 In Progress

**Requirements**:
- [ ] Errors clearly identified
- [ ] Error messages provide solutions
- [ ] Errors announced to screen readers
- [ ] Errors don't rely solely on color

**Implementation**:
```tsx
// ✅ Good: Clear error messaging
{errors.email && (
  <div className="flex items-center gap-2 text-red-600" role="alert">
    <AlertIcon aria-hidden="true" />
    <span>{errors.email.message}</span>
  </div>
)}

// Form validation with helpful messages
const schema = z.object({
  email: z.string()
    .email('Please enter a valid email address (e.g., user@example.com)'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
})
```

---

### 10. Screen Reader Compatibility (Robust)

**Status**: ⏳ Pending Testing

**Requirements**:
- [ ] Content readable by screen readers
- [ ] Dynamic content updates announced
- [ ] Hidden content properly marked
- [ ] Status messages announced

**Implementation**:
```tsx
// ✅ Good: Screen reader announcements
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {cartItemsCount} items in cart
</div>

// ✅ Good: Visually hidden but screen reader accessible
<style jsx>{`
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  .sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
`}</style>

// ✅ Good: Hide decorative content from screen readers
<Icon aria-hidden="true" />

// ❌ Bad: Important content hidden from screen readers
<div aria-hidden="true">Important pricing information</div>
```

---

## Testing Tools

### Automated Testing
1. **Lighthouse** (Chrome DevTools)
   ```bash
   # Run accessibility audit
   npm run lighthouse
   ```

2. **axe DevTools** (Browser extension)
   - [Chrome](https://chrome.google.com/webstore/detail/axe-devtools/lhdoppojpmngadmnindnejefpokejbdd)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)

3. **WAVE** (Web Accessibility Evaluation Tool)
   - [WAVE Browser Extension](https://wave.webaim.org/extension/)

### Manual Testing
1. **Keyboard Navigation**
   - Tab through entire page
   - Test all interactive elements
   - Verify focus indicators visible

2. **Screen Reader Testing**
   - **macOS**: VoiceOver (Cmd + F5)
   - **Windows**: NVDA (free) or JAWS
   - **Mobile**: TalkBack (Android) or VoiceOver (iOS)

3. **Color Blind Simulation**
   - Chrome DevTools > Rendering > Emulate vision deficiencies

---

## Quick Wins (High Impact, Low Effort)

### 1. Add Skip Navigation Link
```tsx
// Add to layout
<a href="#main-content" className="skip-nav">
  Skip to main content
</a>
```

### 2. Improve Focus Indicators
```css
/* Add to globals.css */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### 3. Add ARIA Labels to Icon Buttons
```tsx
// Before
<button><TrashIcon /></button>

// After
<button aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</button>
```

### 4. Ensure All Images Have Alt Text
```bash
# Find images without alt text
npm run lint | grep "@next/next/no-img-element"
```

### 5. Add Document Language
```tsx
// pages/_document.tsx or app/layout.tsx
<html lang="en">
```

---

## Common Pitfalls

1. **Using placeholder as label** ❌
   - Placeholders disappear when typing
   - Use visible labels instead

2. **div/span as buttons** ❌
   - Breaks keyboard navigation
   - Use `<button>` or add proper ARIA roles

3. **Low contrast text** ❌
   - Gray text on white background often fails
   - Use tools to verify contrast ratios

4. **Missing alt text** ❌
   - Breaks screen reader experience
   - Always provide meaningful alt text

5. **Inaccessible modals** ❌
   - Focus not trapped in modal
   - Escape key doesn't close
   - Implement proper focus management

---

## Accessibility Statement

**Template**: Add to your site footer

```markdown
# Accessibility Statement

We are committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

## Conformance Status
The Web Content Accessibility Guidelines (WCAG) define requirements to improve accessibility. We aim for Level AA conformance with WCAG 2.1.

## Feedback
We welcome your feedback on the accessibility of this website. Please contact us:
- Email: accessibility@stepperslife.com
- Phone: [Your phone number]

## Technical Specifications
This website was built using:
- Next.js 15
- React 18
- Tailwind CSS

Last updated: [Date]
```

---

## Implementation Timeline

### Phase 1 (Week 3 Days 1-2): Critical Issues
- [x] Audit current state
- [ ] Fix keyboard navigation
- [ ] Add skip navigation
- [ ] Improve focus indicators
- [ ] Add ARIA labels to icon buttons

### Phase 2 (Week 3 Days 3-4): Major Improvements
- [ ] Fix color contrast issues
- [ ] Ensure all images have alt text
- [ ] Implement proper heading hierarchy
- [ ] Add ARIA landmarks

### Phase 3 (Week 3 Day 5): Polish & Testing
- [ ] Test with screen readers
- [ ] Run automated audits
- [ ] Fix remaining issues
- [ ] Create accessibility statement

**Target**: WCAG 2.1 AA compliance by end of Week 3
