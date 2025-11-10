-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('NEWS', 'EVENTS', 'INTERVIEWS', 'HISTORY', 'TUTORIALS', 'LIFESTYLE', 'FASHION', 'CULTURE', 'COMMUNITY');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');

-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'VERIFYING', 'VERIFIED', 'FAILED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'SHIPPED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "MarketplaceOrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "MarketplacePaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProcessor" AS ENUM ('STRIPE', 'PAYPAL', 'SQUARE', 'CASH');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('ACCESSORIES', 'ART_AND_COLLECTIBLES', 'BAGS_AND_PURSES', 'BATH_AND_BEAUTY', 'BOOKS_MOVIES_AND_MUSIC', 'CLOTHING', 'CRAFT_SUPPLIES_AND_TOOLS', 'ELECTRONICS_AND_ACCESSORIES', 'HOME_AND_LIVING', 'JEWELRY', 'PAPER_AND_PARTY_SUPPLIES', 'PET_SUPPLIES', 'SHOES', 'TOYS_AND_GAMES', 'WEDDINGS');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'FLAGGED', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "SSLStatus" AS ENUM ('PENDING', 'REQUESTING', 'ACTIVE', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'STORE_OWNER', 'STORE_ADMIN', 'RESTAURANT_OWNER', 'EVENT_ORGANIZER', 'INSTRUCTOR', 'SERVICE_PROVIDER', 'MAGAZINE_WRITER', 'RESTAURANT_MANAGER', 'RESTAURANT_STAFF', 'EVENT_STAFF', 'AFFILIATE', 'MAGAZINE_EDITOR');

-- CreateEnum
CREATE TYPE "VariantType" AS ENUM ('SIZE', 'COLOR');

-- CreateEnum
CREATE TYPE "WithdrawMethod" AS ENUM ('BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'SKRILL');

-- CreateEnum
CREATE TYPE "WithdrawStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AnnouncementTarget" AS ENUM ('ALL_VENDORS', 'SPECIFIC_VENDORS');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ShippingType" AS ENUM ('FLAT_RATE', 'FREE_SHIPPING', 'WEIGHT_BASED', 'LOCAL_PICKUP');

-- CreateEnum
CREATE TYPE "AddonFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'SELECT', 'CHECKBOX', 'RADIO', 'DATE', 'FILE', 'COLOR', 'IMAGE_BUTTONS');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'PERCENTAGE', 'FORMULA');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "article_likes" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorPhoto" TEXT,
    "authorBio" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitle" TEXT,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "metaTitle" VARCHAR(60),
    "metaDescription" VARCHAR(160),
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "category" "ArticleCategory" NOT NULL,
    "subCategory" TEXT,
    "tags" TEXT[],
    "featuredImageUrl" TEXT,
    "featuredImageAlt" TEXT,
    "featuredImageCaption" TEXT,
    "contentBlocks" JSONB,
    "readingTime" INTEGER,
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "publishedAt" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_flags" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userPhoto" TEXT,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "flagCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "vendorStoreId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minPurchaseAmount" DECIMAL(10,2),
    "maxDiscountAmount" DECIMAL(10,2),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "perCustomerLimit" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicableProducts" TEXT[],
    "applicableCategories" TEXT[],
    "excludedProducts" TEXT[],
    "firstTimeCustomersOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "caption" TEXT,
    "credit" TEXT,
    "bucketKey" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_addons" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "maxQuantity" INTEGER,
    "requiredForVariants" JSONB,
    "excludedForVariants" JSONB,
    "imageUrl" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fieldType" "AddonFieldType" NOT NULL DEFAULT 'TEXT',
    "options" JSONB,
    "conditionalLogic" JSONB,
    "priceType" "PriceType" NOT NULL DEFAULT 'FIXED',
    "priceFormula" TEXT,
    "minValue" DECIMAL(10,2),
    "maxValue" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "medium" TEXT,
    "large" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "customerId" TEXT,
    "vendorStoreId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(100),
    "review" TEXT NOT NULL,
    "photoUrls" TEXT[],
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT true,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "vendorResponse" TEXT,
    "vendorRespondedAt" TIMESTAMP(3),
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "flaggedAt" TIMESTAMP(3),
    "flagReason" TEXT,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "unhelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "sku" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "vendorStoreId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "compareAtPrice" DECIMAL(10,2),
    "sku" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "trackInventory" BOOLEAN NOT NULL DEFAULT true,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "category" "ProductCategory" NOT NULL,
    "subcategory" TEXT,
    "tags" TEXT[],
    "hasVariants" BOOLEAN NOT NULL DEFAULT false,
    "variantType" "VariantType",
    "weight" DECIMAL(8,2),
    "requiresShipping" BOOLEAN NOT NULL DEFAULT true,
    "metaTitle" VARCHAR(60),
    "metaDescription" VARCHAR(160),
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "variantTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "useMultiVariants" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_ratings" (
    "id" TEXT NOT NULL,
    "vendorStoreId" TEXT NOT NULL,
    "averageRating" DECIMAL(3,2) NOT NULL,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "fiveStars" INTEGER NOT NULL DEFAULT 0,
    "fourStars" INTEGER NOT NULL DEFAULT 0,
    "threeStars" INTEGER NOT NULL DEFAULT 0,
    "twoStars" INTEGER NOT NULL DEFAULT 0,
    "oneStar" INTEGER NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_order_items" (
    "id" TEXT NOT NULL,
    "storeOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "variantName" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addons" JSONB,
    "variantCombinationId" TEXT,
    "variantDetails" JSONB,

    CONSTRAINT "store_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "vendorStoreId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "shippingAddress" JSONB NOT NULL,
    "billingAddress" JSONB NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "shippingCost" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "vendorPayout" DECIMAL(10,2) NOT NULL,
    "paymentProcessor" "PaymentProcessor" NOT NULL DEFAULT 'STRIPE',
    "paymentIntentId" TEXT,
    "paymentStatus" "MarketplacePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'UNFULFILLED',
    "shippingMethod" TEXT,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "status" "MarketplaceOrderStatus" NOT NULL DEFAULT 'PENDING',
    "customerNotes" TEXT,
    "internalNotes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "couponCode" TEXT,
    "couponId" TEXT,

    CONSTRAINT "store_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT,
    "status" TEXT NOT NULL,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'TRIAL',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "customDomain" TEXT,
    "customDomainVerified" BOOLEAN NOT NULL DEFAULT false,
    "customDomainStatus" "DomainStatus" NOT NULL DEFAULT 'PENDING',
    "customDomainDnsRecord" TEXT,
    "sslCertificateStatus" "SSLStatus" NOT NULL DEFAULT 'PENDING',
    "sslCertificateExpiry" TIMESTAMP(3),
    "sslLastCheckedAt" TIMESTAMP(3),
    "maxProducts" INTEGER NOT NULL DEFAULT 10,
    "maxOrders" INTEGER NOT NULL DEFAULT 20,
    "maxStorageGB" DECIMAL(5,2) NOT NULL DEFAULT 0.5,
    "currentProducts" INTEGER NOT NULL DEFAULT 0,
    "currentOrders" INTEGER NOT NULL DEFAULT 0,
    "currentStorageGB" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "platformFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 7.0,
    "trialEndsAt" TIMESTAMP(3),
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#10b981',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_combinations" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "combinationKey" TEXT NOT NULL,
    "optionValues" JSONB NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(10,2),
    "compareAtPrice" DECIMAL(10,2),
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "inventoryTracked" BOOLEAN NOT NULL DEFAULT true,
    "lowStockThreshold" INTEGER,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_combinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_options" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "hexColor" TEXT,
    "imageUrl" TEXT,
    "icon" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_stores" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" VARCHAR(100),
    "description" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "shipFromAddress" JSONB,
    "shippingRates" JSONB,
    "stripeAccountId" TEXT,
    "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripeDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "platformFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 7.0,
    "totalProducts" INTEGER NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "primaryPaymentProcessor" "PaymentProcessor" NOT NULL DEFAULT 'STRIPE',
    "secondaryPaymentProcessor" "PaymentProcessor",
    "paypalEmail" TEXT,
    "paypalMerchantId" TEXT,
    "squareAccessToken" TEXT,
    "squareLocationId" TEXT,
    "acceptsCash" BOOLEAN NOT NULL DEFAULT false,
    "cashInstructions" TEXT,
    "tenantId" TEXT,
    "withdrawBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "withdrawMethod" "WithdrawMethod",
    "bankAccountDetails" JSONB,
    "minimumWithdraw" DECIMAL(10,2) NOT NULL DEFAULT 50,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "vendor_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "expertise" TEXT[],
    "photoUrl" TEXT,
    "instagramUrl" TEXT,
    "twitterUrl" TEXT,
    "websiteUrl" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "totalArticles" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "writer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_withdraws" (
    "id" TEXT NOT NULL,
    "vendorStoreId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "WithdrawMethod" NOT NULL,
    "status" "WithdrawStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "adminNotes" TEXT,
    "bankDetails" JSONB,

    CONSTRAINT "vendor_withdraws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "targetType" "AnnouncementTarget" NOT NULL,
    "targetVendors" TEXT[],
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_reads" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "vendorStoreId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_hours" (
    "id" TEXT NOT NULL,
    "vendorStoreId" TEXT NOT NULL,
    "monday" JSONB,
    "tuesday" JSONB,
    "wednesday" JSONB,
    "thursday" JSONB,
    "friday" JSONB,
    "saturday" JSONB,
    "sunday" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "store_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_vacations" (
    "id" TEXT NOT NULL,
    "vendorStoreId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_vacations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_zones" (
    "id" TEXT NOT NULL,
    "vendorStoreId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regions" JSONB NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_rates" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ShippingType" NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "minOrderAmount" DECIMAL(10,2),
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_followers" (
    "id" TEXT NOT NULL,
    "vendorStoreId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "followedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifyNewProducts" BOOLEAN NOT NULL DEFAULT true,
    "notifySales" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vendor_followers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_provider_idx" ON "Account"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "article_likes_articleId_idx" ON "article_likes"("articleId");

-- CreateIndex
CREATE INDEX "article_likes_userId_idx" ON "article_likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "article_likes_articleId_userId_key" ON "article_likes"("articleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_authorId_idx" ON "articles"("authorId");

-- CreateIndex
CREATE INDEX "articles_category_idx" ON "articles"("category");

-- CreateIndex
CREATE INDEX "articles_publishedAt_idx" ON "articles"("publishedAt");

-- CreateIndex
CREATE INDEX "articles_reviewedBy_idx" ON "articles"("reviewedBy");

-- CreateIndex
CREATE INDEX "articles_status_idx" ON "articles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "comment_flags_commentId_idx" ON "comment_flags"("commentId");

-- CreateIndex
CREATE INDEX "comment_flags_userId_idx" ON "comment_flags"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_flags_commentId_userId_key" ON "comment_flags"("commentId", "userId");

-- CreateIndex
CREATE INDEX "comments_articleId_idx" ON "comments"("articleId");

-- CreateIndex
CREATE INDEX "comments_deletedAt_idx" ON "comments"("deletedAt");

-- CreateIndex
CREATE INDEX "comments_isFlagged_idx" ON "comments"("isFlagged");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_endDate_idx" ON "coupons"("endDate");

-- CreateIndex
CREATE INDEX "coupons_vendorStoreId_isActive_idx" ON "coupons"("vendorStoreId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_vendorStoreId_code_key" ON "coupons"("vendorStoreId", "code");

-- CreateIndex
CREATE INDEX "media_createdAt_idx" ON "media"("createdAt");

-- CreateIndex
CREATE INDEX "media_mimeType_idx" ON "media"("mimeType");

-- CreateIndex
CREATE INDEX "media_uploadedById_idx" ON "media"("uploadedById");

-- CreateIndex
CREATE INDEX "product_addons_productId_isActive_idx" ON "product_addons"("productId", "isActive");

-- CreateIndex
CREATE INDEX "product_addons_storeId_isActive_idx" ON "product_addons"("storeId", "isActive");

-- CreateIndex
CREATE INDEX "product_images_productId_idx" ON "product_images"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_reviews_orderItemId_key" ON "product_reviews"("orderItemId");

-- CreateIndex
CREATE INDEX "product_reviews_customerId_idx" ON "product_reviews"("customerId");

-- CreateIndex
CREATE INDEX "product_reviews_orderItemId_idx" ON "product_reviews"("orderItemId");

-- CreateIndex
CREATE INDEX "product_reviews_productId_status_createdAt_idx" ON "product_reviews"("productId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "product_reviews_vendorStoreId_createdAt_idx" ON "product_reviews"("vendorStoreId", "createdAt");

-- CreateIndex
CREATE INDEX "product_variants_productId_available_idx" ON "product_variants"("productId", "available");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_category_status_idx" ON "products"("category", "status");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_useMultiVariants_idx" ON "products"("useMultiVariants");

-- CreateIndex
CREATE INDEX "products_vendorStoreId_status_idx" ON "products"("vendorStoreId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "products_vendorStoreId_slug_key" ON "products"("vendorStoreId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "shop_ratings_vendorStoreId_key" ON "shop_ratings"("vendorStoreId");

-- CreateIndex
CREATE INDEX "store_order_items_productId_idx" ON "store_order_items"("productId");

-- CreateIndex
CREATE INDEX "store_order_items_storeOrderId_idx" ON "store_order_items"("storeOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "store_orders_orderNumber_key" ON "store_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "store_orders_paymentIntentId_key" ON "store_orders"("paymentIntentId");

-- CreateIndex
CREATE INDEX "store_orders_couponId_idx" ON "store_orders"("couponId");

-- CreateIndex
CREATE INDEX "store_orders_createdAt_idx" ON "store_orders"("createdAt");

-- CreateIndex
CREATE INDEX "store_orders_customerEmail_idx" ON "store_orders"("customerEmail");

-- CreateIndex
CREATE INDEX "store_orders_customerId_idx" ON "store_orders"("customerId");

-- CreateIndex
CREATE INDEX "store_orders_fulfillmentStatus_idx" ON "store_orders"("fulfillmentStatus");

-- CreateIndex
CREATE INDEX "store_orders_paymentStatus_idx" ON "store_orders"("paymentStatus");

-- CreateIndex
CREATE INDEX "store_orders_status_idx" ON "store_orders"("status");

-- CreateIndex
CREATE INDEX "store_orders_vendorStoreId_createdAt_idx" ON "store_orders"("vendorStoreId", "createdAt");

-- CreateIndex
CREATE INDEX "store_orders_vendorStoreId_status_createdAt_idx" ON "store_orders"("vendorStoreId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "subscription_history_tenantId_createdAt_idx" ON "subscription_history"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_stripeCustomerId_key" ON "tenants"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_stripeSubscriptionId_key" ON "tenants"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_customDomain_key" ON "tenants"("customDomain");

-- CreateIndex
CREATE INDEX "tenants_customDomain_idx" ON "tenants"("customDomain");

-- CreateIndex
CREATE INDEX "tenants_ownerId_idx" ON "tenants"("ownerId");

-- CreateIndex
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_subscriptionStatus_idx" ON "tenants"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "usage_records_tenantId_metric_timestamp_idx" ON "usage_records"("tenantId", "metric", "timestamp");

-- CreateIndex
CREATE INDEX "variant_combinations_productId_available_idx" ON "variant_combinations"("productId", "available");

-- CreateIndex
CREATE INDEX "variant_combinations_productId_inStock_idx" ON "variant_combinations"("productId", "inStock");

-- CreateIndex
CREATE UNIQUE INDEX "variant_combinations_productId_combinationKey_key" ON "variant_combinations"("productId", "combinationKey");

-- CreateIndex
CREATE INDEX "variant_options_productId_isActive_idx" ON "variant_options"("productId", "isActive");

-- CreateIndex
CREATE INDEX "variant_options_productId_type_idx" ON "variant_options"("productId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_stores_storeId_key" ON "vendor_stores"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_stores_slug_key" ON "vendor_stores"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_stores_stripeAccountId_key" ON "vendor_stores"("stripeAccountId");

-- CreateIndex
CREATE INDEX "vendor_stores_isActive_idx" ON "vendor_stores"("isActive");

-- CreateIndex
CREATE INDEX "vendor_stores_slug_idx" ON "vendor_stores"("slug");

-- CreateIndex
CREATE INDEX "vendor_stores_tenantId_idx" ON "vendor_stores"("tenantId");

-- CreateIndex
CREATE INDEX "vendor_stores_userId_idx" ON "vendor_stores"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "writer_profiles_userId_key" ON "writer_profiles"("userId");

-- CreateIndex
CREATE INDEX "writer_profiles_userId_idx" ON "writer_profiles"("userId");

-- CreateIndex
CREATE INDEX "vendor_withdraws_vendorStoreId_status_idx" ON "vendor_withdraws"("vendorStoreId", "status");

-- CreateIndex
CREATE INDEX "vendor_withdraws_status_requestedAt_idx" ON "vendor_withdraws"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "announcements_status_publishAt_idx" ON "announcements"("status", "publishAt");

-- CreateIndex
CREATE INDEX "announcements_createdBy_idx" ON "announcements"("createdBy");

-- CreateIndex
CREATE INDEX "announcement_reads_vendorStoreId_readAt_idx" ON "announcement_reads"("vendorStoreId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reads_announcementId_vendorStoreId_key" ON "announcement_reads"("announcementId", "vendorStoreId");

-- CreateIndex
CREATE UNIQUE INDEX "store_hours_vendorStoreId_key" ON "store_hours"("vendorStoreId");

-- CreateIndex
CREATE INDEX "store_vacations_vendorStoreId_startDate_idx" ON "store_vacations"("vendorStoreId", "startDate");

-- CreateIndex
CREATE INDEX "store_vacations_vendorStoreId_isActive_idx" ON "store_vacations"("vendorStoreId", "isActive");

-- CreateIndex
CREATE INDEX "shipping_zones_vendorStoreId_isEnabled_idx" ON "shipping_zones"("vendorStoreId", "isEnabled");

-- CreateIndex
CREATE INDEX "shipping_rates_zoneId_isEnabled_idx" ON "shipping_rates"("zoneId", "isEnabled");

-- CreateIndex
CREATE INDEX "vendor_followers_customerId_idx" ON "vendor_followers"("customerId");

-- CreateIndex
CREATE INDEX "vendor_followers_vendorStoreId_idx" ON "vendor_followers"("vendorStoreId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_followers_vendorStoreId_customerId_key" ON "vendor_followers"("vendorStoreId", "customerId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_likes" ADD CONSTRAINT "article_likes_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_likes" ADD CONSTRAINT "article_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_flags" ADD CONSTRAINT "comment_flags_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_flags" ADD CONSTRAINT "comment_flags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_vendorStoreId_fkey" FOREIGN KEY ("vendorStoreId") REFERENCES "vendor_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "store_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_vendorStoreId_fkey" FOREIGN KEY ("vendorStoreId") REFERENCES "vendor_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_vendorStoreId_fkey" FOREIGN KEY ("vendorStoreId") REFERENCES "vendor_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_ratings" ADD CONSTRAINT "shop_ratings_vendorStoreId_fkey" FOREIGN KEY ("vendorStoreId") REFERENCES "vendor_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_order_items" ADD CONSTRAINT "store_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_order_items" ADD CONSTRAINT "store_order_items_storeOrderId_fkey" FOREIGN KEY ("storeOrderId") REFERENCES "store_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_vendorStoreId_fkey" FOREIGN KEY ("vendorStoreId") REFERENCES "vendor_stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_combinations" ADD CONSTRAINT "variant_combinations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_options" ADD CONSTRAINT "variant_options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_stores" ADD CONSTRAINT "vendor_stores_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_stores" ADD CONSTRAINT "vendor_stores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writer_profiles" ADD CONSTRAINT "writer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_withdraws" ADD CONSTRAINT "vendor_withdraws_vendorStoreId_fkey" FOREIGN KEY ("vendorStoreId") REFERENCES "vendor_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_vendorStoreId_fkey" FOREIGN KEY ("vendorStoreId") REFERENCES "vendor_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_hours" ADD CONSTRAINT "store_hours_vendorStoreId_fkey" FOREIGN KEY ("vendorStoreId") REFERENCES "vendor_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_vacations" ADD CONSTRAINT "store_vacations_vendorStoreId_fkey" FOREIGN KEY ("vendorStoreId") REFERENCES "vendor_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_zones" ADD CONSTRAINT "shipping_zones_vendorStoreId_fkey" FOREIGN KEY ("vendorStoreId") REFERENCES "vendor_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "shipping_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_followers" ADD CONSTRAINT "vendor_followers_vendorStoreId_fkey" FOREIGN KEY ("vendorStoreId") REFERENCES "vendor_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_followers" ADD CONSTRAINT "vendor_followers_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
