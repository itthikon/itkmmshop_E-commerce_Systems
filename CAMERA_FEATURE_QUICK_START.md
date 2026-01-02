# Camera Feature - Quick Start Guide

## 🚀 Ready to Implement

ฟีเจอร์การถ่ายภาพและการตั้งชื่อไฟล์อัตโนมัติพร้อมสำหรับการพัฒนาแล้ว!

## 📚 Documentation

| Document | Purpose | Link |
|----------|---------|------|
| **Requirements** | ความต้องการของระบบ (8 requirements) | `.kiro/specs/product-image-camera/requirements.md` |
| **Design** | การออกแบบระบบ (Architecture, API, Components) | `.kiro/specs/product-image-camera/design.md` |
| **Tasks** | แผนการพัฒนา (14 tasks, 3 phases, 21 hours) | `.kiro/specs/product-image-camera/tasks.md` |
| **Summary** | สรุปและติดตามความคืบหน้า | `CAMERA_FEATURE_SUMMARY.md` |

## 🎯 What We're Building

### Feature 1: Camera Capture 📷
- ถ่ายภาพสินค้าโดยตรงจากกล้อง
- รองรับทั้ง mobile และ desktop
- สลับกล้องหน้า/หลังได้
- แสดง preview ก่อนยืนยัน

### Feature 2: Auto-Rename by SKU 🏷️
- เปลี่ยนชื่อไฟล์เป็น `{SKU}.{extension}`
- ตัวอย่าง: `ELEC00001.jpg`, `FASH00123.png`
- ลบรูปเก่าที่มี SKU เดียวกันอัตโนมัติ
- จัดเก็บใน `/uploads/products/`

## 📋 Implementation Phases

### Phase 1: Backend Auto-Rename (4 hours) 🔴 HIGH PRIORITY

**Start Here!** ให้ผลลัพธ์ทันทีและเป็นพื้นฐานสำหรับ Phase 2

**Tasks:**
1. Create `FileNamingService.js` (1h)
2. Update `productController.js` (1.5h)
3. Update `upload.js` middleware (0.5h)
4. Test auto-rename (1h)

**Files to Create/Modify:**
```
backend/
├── services/
│   └── FileNamingService.js          [NEW]
├── controllers/
│   └── productController.js          [MODIFY]
├── middleware/
│   └── upload.js                     [MODIFY]
└── test-image-rename.js              [NEW]
```

**Quick Implementation:**
```javascript
// FileNamingService.js - Key methods
generateProductImageName(sku, originalFilename)  // Returns: "ELEC00001.jpg"
deleteOldProductImage(sku, uploadsDir)           // Deletes old images
renameToSKUFormat(currentPath, sku)              // Renames uploaded file
```

---

### Phase 2: Camera Capture UI (11.5 hours) 🟡 MEDIUM PRIORITY

**Requires Phase 1 Complete**

**Tasks:**
1. Create `CameraCapture` component (3h)
2. Create `ImageUploadSection` component (2h)
3. Integrate with `ProductManagement` (1.5h)
4. Add camera permission handling (1h)
5. Mobile optimization (2h)
6. End-to-end testing (2h)

**Files to Create/Modify:**
```
frontend/src/
├── components/product/
│   ├── CameraCapture.js              [NEW]
│   ├── CameraCapture.css             [NEW]
│   ├── ImageUploadSection.js         [NEW]
│   └── ImageUploadSection.css        [NEW]
└── pages/admin/
    └── ProductManagement.js          [MODIFY]
```

**Key Component:**
```javascript
// CameraCapture.js - Main functionality
- Access camera: navigator.mediaDevices.getUserMedia()
- Display preview: <video> element
- Capture photo: Canvas API
- Convert to File: canvas.toBlob()
```

---

### Phase 3: Polish & Optimization (5.5 hours) 🟢 LOW PRIORITY

**Optional Enhancements**

**Tasks:**
1. Add image compression (2h)
2. Add upload progress (1h)
3. Improve error messages (1h)
4. Add image zoom (1.5h)

---

## 🏃 Quick Start Commands

### Start Phase 1 (Backend)

```bash
# 1. Create FileNamingService
cd backend/services
# Create FileNamingService.js (see design.md for code)

# 2. Update productController.js
cd ../controllers
# Modify uploadImage function (see design.md)

# 3. Test
node test-image-rename.js
```

### Start Phase 2 (Frontend)

```bash
# 1. Create camera component
cd frontend/src/components/product
# Create CameraCapture.js and CameraCapture.css

# 2. Create upload section
# Create ImageUploadSection.js and ImageUploadSection.css

# 3. Integrate
cd ../../pages/admin
# Modify ProductManagement.js
```

## 📖 Code Examples

### Backend: FileNamingService

```javascript
// Generate SKU-based filename
const filename = FileNamingService.generateProductImageName(
  'ELEC00001', 
  'photo.jpg'
);
// Returns: "ELEC00001.jpg"

// Rename uploaded file
const newFilename = await FileNamingService.renameToSKUFormat(
  '/uploads/products/temp-12345.jpg',
  'ELEC00001'
);
// File renamed to: ELEC00001.jpg
// Old ELEC00001.* files deleted
```

### Frontend: Camera Access

```javascript
// Start camera
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: 'environment', // rear camera
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  }
});

// Capture photo
const canvas = document.createElement('canvas');
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
canvas.getContext('2d').drawImage(video, 0, 0);

// Convert to File
canvas.toBlob((blob) => {
  const file = new File([blob], 'camera-capture.jpg', {
    type: 'image/jpeg'
  });
  onImageSelect(file);
}, 'image/jpeg', 0.9);
```

## 🧪 Testing Checklist

### Phase 1 Testing
- [ ] Upload image → File renamed to SKU
- [ ] Upload again → Old file deleted, new file saved
- [ ] Different extensions (.jpg, .png) work
- [ ] Error handling (product not found, invalid file)

### Phase 2 Testing
- [ ] Camera opens on button click
- [ ] Camera preview displays
- [ ] Capture button takes photo
- [ ] Switch camera button works
- [ ] Permission errors handled
- [ ] Works on mobile (iOS, Android)
- [ ] Works on desktop (Chrome, Firefox, Safari)

## 🎨 UI Preview

### Before (Current)
```
┌─────────────────────────────┐
│ รูปภาพสินค้า                │
│ [Preview]                   │
│ [📁 เลือกรูปภาพ]            │
└─────────────────────────────┘
```

### After (New)
```
┌─────────────────────────────┐
│ รูปภาพสินค้า                │
│ [Preview]                   │
│ [📁 เลือกรูป] [📷 ถ่ายภาพ] │
└─────────────────────────────┘
```

## 📊 Progress Tracking

Update this section as you complete tasks:

### Phase 1: Backend Auto-Rename
- [ ] Task 1.1: FileNamingService
- [ ] Task 1.2: Update Controller
- [ ] Task 1.3: Update Multer
- [ ] Task 1.4: Test Backend

### Phase 2: Camera Capture UI
- [ ] Task 2.1: CameraCapture Component
- [ ] Task 2.2: ImageUploadSection Component
- [ ] Task 2.3: Integration
- [ ] Task 2.4: Permission Handling
- [ ] Task 2.5: Mobile Optimization
- [ ] Task 2.6: End-to-End Testing

### Phase 3: Polish & Optimization
- [ ] Task 3.1: Image Compression
- [ ] Task 3.2: Upload Progress
- [ ] Task 3.3: Error Messages
- [ ] Task 3.4: Image Zoom

## 🚨 Important Notes

1. **Start with Phase 1** - It provides immediate value and is required for Phase 2
2. **Test on real devices** - Camera behavior differs from emulators
3. **Handle permissions gracefully** - Users may deny camera access
4. **Security first** - Validate files on both frontend and backend
5. **Mobile-first** - Most users will use camera on mobile devices

## 🔗 Related Documentation

- `AUTO_SKU_USER_GUIDE.md` - User guide for SKU feature
- `backend/API_DOCUMENTATION_SKU.md` - API documentation
- `MANUAL_SKU_GENERATION_UPDATE.md` - Manual SKU generation

## 💡 Tips

- **Phase 1 can be deployed independently** - Don't wait for Phase 2
- **Test camera on HTTPS** - Camera API requires secure context
- **Use localhost for development** - It's considered secure
- **Compress images on mobile** - Mobile photos are often very large
- **Provide clear error messages** - Users need to know what went wrong

## 🎯 Success Metrics

- ✅ Images renamed to SKU format: 100%
- ✅ Camera works on modern devices: 95%+
- ✅ Upload time: < 3 seconds
- ✅ Camera preview starts: < 1 second
- ✅ User satisfaction: High

## 📞 Need Help?

Refer to detailed documentation:
- **Requirements:** `.kiro/specs/product-image-camera/requirements.md`
- **Design:** `.kiro/specs/product-image-camera/design.md`
- **Tasks:** `.kiro/specs/product-image-camera/tasks.md`
- **Summary:** `CAMERA_FEATURE_SUMMARY.md`

---

**Ready to start?** Begin with Phase 1 - Backend Auto-Rename! 🚀
