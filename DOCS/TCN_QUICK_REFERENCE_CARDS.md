# TCN Member Database - Quick Reference Cards

---

## Card 1: Login & Navigation Quick Start

### **🔐 LOGGING IN**
1. **Open browser** → Go to TCN Member Database URL
2. **Enter credentials** → Email & Password
3. **Click "Sign In"** → Access your dashboard

### **🧭 MAIN NAVIGATION (Home Page)**
| Card | Function | Access Level |
|------|----------|--------------|
| 📊 **Dashboard** | Analytics & Reports | All Users |
| 👥 **Member Editor** | Manage Members | Admin Only |
| 🏛️ **Chief & Council** | Governance Portal | Council Only |
| 👤 **User Manager** | System Users | Admin Only |
| 🔄 **Portal Sync** | Data Sync | Admin Only |
| ✏️ **Profile Editor** | Edit Your Profile | All Users |

### **⚡ QUICK ACTIONS**
- **Search Members**: Use search bar in Member Editor
- **Create Member**: Click "Create New Member" button
- **View Stats**: Dashboard → Overview tab
- **Logout**: Click user avatar → Logout button

### **🆘 NEED HELP?**
- **Reset Password**: Login page → "Forgot Password"
- **Technical Issues**: Contact your administrator
- **User Guide**: Reference full user manual

---

## Card 2: Member Management Quick Reference

### **👤 CREATING NEW MEMBERS**
**✅ Required Fields:**
- First Name
- Last Name  
- Birth Date (use date picker)
- T-Number (must be unique)

**⚠️ Remember:**
- Barcode assigned automatically
- T-numbers must be unique
- System validates all data

### **✏️ EDITING MEMBERS**
1. **Select member** from list
2. **Edit form opens** on right panel
3. **Modify fields** as needed
4. **Save changes** → Confirm success

### **🔍 SEARCHING MEMBERS**
- **By Name**: Type first or last name
- **By T-Number**: Enter T-number
- **Clear Search**: Click X in search box
- **Real-time Results**: List updates as you type

### **📊 MEMBER INFORMATION**
**Core Data:**
- Personal details (name, birth date)
- T-number (unique ID)
- Deceased status

**Profile Data:**
- Contact info (address, phone, email)
- Community and province
- On/Off reserve status

**Family Data:**
- Spouse information
- Number of dependents

### **🏷️ BARCODE SYSTEM**
- **Auto-Assigned**: New members get next available barcode
- **Status Indicators**: Visual status of assignments
- **Available Pool**: Managed automatically

### **❌ DELETING MEMBERS**
**⚠️ WARNING: Permanent action!**
1. Select member → Click delete button (trash icon)
2. Confirm deletion in popup
3. Member and all related data removed
4. Barcode returns to available pool

---

## Card 3: Dashboard & Analytics Quick Reference

### **📈 DASHBOARD SECTIONS**

#### **📊 Overview (Member Statistics)**
- **Total Members**: Complete count with trends
- **Recent Registrations**: New members (last 7 days)
- **Barcode Status**: Assignment statistics
- **Growth Indicators**: Trend arrows

#### **🏘️ Reserve Status**
- **On-Reserve vs Off-Reserve**: Population distribution
- **Pie Chart**: Visual percentage breakdown
- **Hover Details**: Exact member counts

#### **🌍 Community Distribution**
- **Bar Chart**: Members by community
- **Sorted View**: Largest communities first
- **Interactive**: Hover for details

#### **📅 Age Demographics**
- **Children**: 0-17 years
- **Adults**: 18-64 years
- **Seniors**: 65+ years
- **Real-time**: Calculated from birth dates

#### **🏷️ Barcode Status**
- **Assigned**: Members with barcodes
- **Available**: Unassigned barcodes
- **Assignment Rate**: Percentage coverage

#### **📋 Recent Activity**
- **Member Changes**: Recent updates
- **System Usage**: Login activity
- **Time-based**: Filter by period

### **⚡ DASHBOARD NAVIGATION**
- **Sidebar**: Click category icons
- **Active Tab**: Highlighted with gradient
- **Auto-refresh**: Data updates automatically
- **Manual Refresh**: Reload specific sections

### **📱 RESPONSIVE DESIGN**
- **Desktop**: Full sidebar navigation
- **Tablet**: Collapsible sidebar
- **Mobile**: Stack layout with scroll

---

## Card 4: Troubleshooting Quick Reference

### **🔐 LOGIN ISSUES**

#### **Can't Login**
✅ **Check:**
- CAPS LOCK on keyboard
- Email spelling correct
- Account not locked
- Try password reset

#### **Account Locked**
✅ **Solutions:**
- Wait 15-30 minutes for auto-unlock
- Contact administrator for immediate unlock
- Use password reset process

#### **PIN Not Received**
✅ **Check:**
- Spam/junk email folders
- Email address spelling
- Wait a few minutes for delivery

### **⚡ PERFORMANCE ISSUES**

#### **System Loading Slowly**
✅ **Try:**
- Check internet connection
- Close extra browser tabs
- Clear browser cache (Ctrl+Shift+Del)
- Try different browser

#### **Dashboard Not Loading**
✅ **Solutions:**
- Refresh page (F5 or Ctrl+R)
- Logout and login again
- Clear browser cache
- Check user role permissions

### **📝 DATA ENTRY PROBLEMS**

#### **T-Number Error**
✅ **Verify:**
- T-number is unique
- Correct format used
- Search existing to confirm uniqueness

#### **Date Fields Not Working**
✅ **Use:**
- Date picker widget (calendar icon)
- Proper format (MM/DD/YYYY)
- Reasonable dates (not future birth dates)

#### **Search Not Working**
✅ **Try:**
- Clear search and try again
- Check spelling
- Use partial names
- Search by T-number for exact match

### **🆘 WHEN TO GET HELP**

#### **Contact Administrator:**
- Account lockouts
- Permission issues
- Data problems
- User management needs

#### **Contact Technical Support:**
- System outages
- Browser compatibility
- Network issues
- Performance problems

### **⚙️ BROWSER QUICK FIXES**

#### **Chrome**
- Hard refresh: `Ctrl+Shift+R`
- Disable extensions temporarily

#### **Firefox**
- Enable JavaScript
- Disable private browsing temporarily

#### **Safari**
- Allow cookies from site
- Disable "Prevent cross-site tracking"

#### **Edge**
- Add to trusted sites
- Ensure not in IE mode

---

## Card 5: Administrator Quick Reference

### **👥 USER MANAGEMENT**

#### **Creating Users**
**✅ Required:**
- Email address (unique)
- First and last name
- Initial password
- Role (ADMIN/CHIEF_COUNCIL)
- Department assignment

**🔒 Security Features:**
- Password complexity enforced
- Account lockout settings
- Login attempt tracking

#### **User Roles**
- **ADMIN**: Full system access
- **CHIEF_COUNCIL**: Governance portal only

#### **Departments**
- **OFFICE_ADMIN**: Administrative staff
- **COUNCIL**: Governance users

### **💾 DATA IMPORT/EXPORT**

#### **Member Import**
```bash
npm run import-members [--dry-run] [--use-csv-ids]
```
**CSV Format:**
- first_name, last_name, birthdate
- t_number (unique), deceased (optional)

#### **Barcode Import**  
```bash
npm run import-barcodes
```
**Sources:**
- BARCODE_REFERENCE/master_normalized.csv
- barcodes1.csv through barcodes10.csv

#### **Barcode Assignment**
```bash
npm run assign-barcodes [--dry-run] [--limit=N]
```

### **🔄 SYNC MANAGEMENT**

#### **Sync Operations**
- **Member Data**: Profile updates from portal
- **Governance**: Chief & Council info
- **Barcode Status**: Assignment updates

#### **Sync Monitoring**
- **Status Dashboard**: Portal Sync page
- **Error Logs**: Failed sync operations
- **Manual Triggers**: Force sync operations

### **📊 SYSTEM MONITORING**

#### **Activity Logs**
- **User Actions**: Login, member changes
- **System Events**: Data imports, sync operations
- **Security Events**: Failed logins, lockouts

#### **Performance Metrics**
- **Response Times**: Page load speeds
- **Database Status**: Connection health
- **Error Rates**: System failure tracking

### **🔧 MAINTENANCE TASKS**

#### **Regular Tasks**
- **User Account Review**: Check active accounts
- **Barcode Pool**: Ensure adequate supply
- **Data Backup**: Verify backup completion
- **Activity Review**: Check system usage

#### **Emergency Procedures**
- **Account Unlock**: Manual user unlock
- **Password Reset**: Emergency access
- **Data Recovery**: Point-in-time restore
- **System Restart**: Service restart procedures

### **📞 SUPPORT ESCALATION**

#### **Level 1**: User Issues
- Password resets
- Account unlocks
- Basic training
- Permission adjustments

#### **Level 2**: System Issues
- Performance problems
- Data integrity issues
- Integration failures
- Security incidents

#### **Level 3**: Technical Issues
- System outages
- Database problems
- Infrastructure issues
- Security breaches

---

## Card 6: Chief & Council Portal Quick Reference

### **🏛️ GOVERNANCE PORTAL ACCESS**

#### **Access Requirements**
- **Role**: CHIEF_COUNCIL
- **Department**: COUNCIL
- **Special Interface**: Amber/orange theme

#### **Available Features**
- **Member Statistics**: View-only demographics
- **Profile Management**: Edit personal information
- **Council Information**: Current council details

### **📊 LIMITED DASHBOARD ACCESS**

#### **Permitted Views**
- **Community Demographics**: Population overviews
- **High-level Statistics**: General member counts
- **Trend Information**: Growth patterns

#### **Restricted Areas**
- **Individual Member Records**: Cannot edit members
- **Detailed Analytics**: Limited access to detailed data
- **Administrative Functions**: No access to admin tools

### **✏️ PROFILE MANAGEMENT**

#### **Editable Information**
- **Personal Details**: Name, contact information
- **Position Information**: Chief/Councillor status
- **Portfolio Assignments**: Responsibility areas
- **Term Information**: Service periods

#### **Portfolio Options**
- Treaty, Health, Education
- Housing, Economic Development
- Environment, Public Safety, Leadership

### **🔒 SECURITY FEATURES**

#### **Access Controls**
- **Automatic Redirects**: Blocked from admin areas
- **Hidden Menus**: Only permitted options visible
- **Role-based UI**: Interface adapts to permissions

#### **Data Protection**
- **View-only Access**: Cannot modify member data
- **Audit Logging**: All actions tracked
- **Session Management**: Secure authentication

### **📋 GOVERNANCE DATA**

#### **Council Positions**
- **Chief**: Primary leadership
- **Councillor**: Council member

#### **Term Management**
- **Start/End Dates**: Council term periods
- **History Tracking**: Previous terms maintained
- **Succession Planning**: Term transition support

---

## Quick Reference - Keyboard Shortcuts

### **⌨️ UNIVERSAL SHORTCUTS**
| Key | Action |
|-----|---------|
| `Enter` | Submit forms |
| `Escape` | Cancel operations |
| `F5` | Refresh page |
| `Ctrl+F` | Focus search |
| `Ctrl+S` | Save forms |
| `Ctrl+L` | Logout |

### **📱 MOBILE ACCESS**
- **Touch Friendly**: Large buttons and inputs
- **Responsive**: Adapts to screen size
- **Gesture Support**: Swipe navigation where applicable

---

**💡 TIP: Print these cards and keep them handy for quick reference!**

**📞 Need Help?**
- **User Manual**: Complete detailed guide available
- **Administrator**: Contact for account issues
- **Technical Support**: For system problems

**📅 Updated**: February 16, 2026 | **Version**: 1.0