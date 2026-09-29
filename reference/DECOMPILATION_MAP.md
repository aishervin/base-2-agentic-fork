# نقشه مسیرهای اصلی

- نام اصلی برنامه: «صدور بارنامه شهری».
- پالت اصلی: رنگ پایه `#128591`، متن تیره `#333333`، پس‌زمینه‌های روشن و دکمه آبی `#4BA8EB`.
- فونت اصلی: IRANSans Mobile؛ فایل‌های انتخاب‌شده در `assets/fonts/` نگه‌داری می‌شوند.
- احراز هویت: `POST /Account/UserLoginV2` با `nationalCode`, `password`, `capToken`.
- فهرست اسناد جاری: `POST /Document/GetShippingDocuments`؛ فهرست صادرشده: `POST /Document/GetIssuedDocuments`.
- جزئیات سند: `POST /Document/GetShippingDocumentByID` با `{ data: docId }`.
- شروع: `POST /Document/RegisterStartOfShipping` با `DocId`, `Speed`, `Altitude`, `Longitude`, `Latitude`, `StartDate`, `havePermission`.
- پایان: `POST /Document/RegisterEndOfShipping` با `docId` و `gpsList`؛ پیش از آن جزئیات سند برای `serverDateTime` خوانده می‌شود.
- مکان‌یابی: timeout اصلی ۱۸ ثانیه و فاصله جمع‌آوری مسیر ۲۰ ثانیه است.
- منبع کامل مرجع اولیه در `outputs/index.android.bundle.decompiled.js` موجود بود. این فورک کپی پاک‌سازی‌شده را داخل خودش نگه می‌دارد.
