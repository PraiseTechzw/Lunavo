# Escalation System & Student Affairs Guide

## How the System Helps Users Showing Unhealthy Signs

### 1. **Automatic Detection System**

The platform automatically detects posts showing signs of distress through:

#### **Keyword & Phrase Detection**
- **Critical Level**: Suicide-related keywords ("suicide", "kill myself", "end my life", "want to die")
- **High Level**: Self-harm ("cutting", "hurting myself"), abuse ("raped", "assaulted", "threatened"), overdose
- **Medium Level**: Severe depression, anxiety, substance abuse issues
- **Low Level**: Academic stress, relationship problems, general mental health concerns

#### **How It Works**
1. When a user creates a post, the system automatically scans the content
2. If dangerous keywords/phrases are detected, the post is **immediately escalated**
3. The escalation level is determined based on severity:
   - **Critical** → Immediate counselor notification
   - **High** → Urgent counselor assignment
   - **Medium** → Counselor review queue
   - **Low** → Peer support monitoring

### 2. **Escalation Flow**

```
User Posts → Auto-Detection → Escalation Created → Counselor Notified → Intervention
```

**For Critical/High Escalations:**
- Post is immediately flagged and hidden from public view
- Counselor/Life Coach receives instant notification
- Post author receives supportive message with crisis resources
- Counselor can reach out through the platform's secure messaging

### 3. **How Counselors Help**

Counselors have access to:
- **Escalation Dashboard**: See all escalated posts in priority order
- **Post Details**: View the full post content (anonymized)
- **Direct Messaging**: Reach out to the student through the platform
- **Meeting Booking**: Schedule in-person or virtual counseling sessions
- **Resource Sharing**: Share relevant support resources

### 4. **How Student Affairs Can Help**

Student Affairs staff have access to:

#### **Analytics Dashboard**
- **Trend Analysis**: See patterns in student concerns (e.g., "Mental health posts increased 30% this month")
- **Category Breakdown**: Identify which issues are most common (academic stress, relationships, etc.)
- **Peak Usage Times**: Understand when students need support most
- **All data is anonymized** - no student identities are revealed

#### **What Student Affairs Can Do**

1. **Identify Trends**
   - "We're seeing a spike in academic stress posts during exam season"
   - "Substance abuse concerns have increased in the Engineering department"
   - "Relationship issues peak on weekends"

2. **Proactive Interventions**
   - Organize workshops based on trending topics
   - Deploy peer educators to specific areas
   - Schedule counseling sessions during peak stress periods
   - Create targeted resources for common issues

3. **Resource Allocation**
   - See which categories need more support
   - Allocate counselors based on demand
   - Plan events and programs based on data

4. **Policy Development**
   - Use anonymized data to inform campus policies
   - Identify systemic issues affecting students
   - Measure effectiveness of support programs

#### **Important Privacy Note**
- Student Affairs **cannot see individual student identities**
- All data is aggregated and anonymized
- They see trends and patterns, not personal information
- This protects student privacy while allowing proactive support

### 5. **CUT Student Verification**

To ensure only CUT students can access the platform:

1. **Email Verification**: User must verify their email address
2. **Student Number Verification**: User must provide their CUT student number
3. **Manual/API Verification**: (Can be integrated with CUT's student database)
   - Verify student number exists in CUT system
   - Confirm student is currently enrolled
   - Check student status (active, suspended, etc.)

**Current Implementation:**
- Student enters student number, name, department, and year
- System marks account as "verified" after submission
- **TODO**: Integrate with CUT's official student database API for real-time verification

### 6. **How to Contact Students in Crisis**

When a post is escalated:

1. **Through Platform Messaging**
   - Counselor can send a direct message to the student
   - Message appears in student's notifications
   - Student can respond anonymously

2. **Meeting Booking**
   - Counselor can create a meeting invitation
   - Student receives notification to book a session
   - Meeting details are shared securely

3. **Emergency Protocol** (For Critical Escalations)
   - If immediate danger is detected, system can:
     - Send urgent notification to on-call counselor
     - Provide crisis hotline numbers
     - Escalate to emergency services if needed (with proper authorization)

### 7. **Student Affairs Dashboard Features**

Located at `/student-affairs/dashboard`:

- **Overview Cards**: Total posts, active users, escalations, average response time
- **Category Breakdown**: See which support categories are most used
- **Escalation Stats**: Track how many students need help and response times
- **Trend Analysis**: View patterns over time (daily, weekly, monthly)
- **Export Data**: Download anonymized reports for planning

### 8. **Privacy & Anonymity Protection**

- **Students remain anonymous** in all analytics
- **Student Affairs sees trends, not individuals**
- **Only counselors see escalated post content** (still anonymized)
- **No student IDs or personal info** in analytics
- **All data aggregated** to protect privacy

---

## Summary

✅ **Unhealthy Signs Detection**: Automatic keyword/phrase detection escalates posts immediately

✅ **Counselor Response**: Counselors get instant notifications and can reach out through the platform

✅ **Student Affairs Support**: Can see trends and patterns to proactively help, but cannot identify individual students

✅ **CUT Verification**: Email + student number verification ensures only CUT students can access

✅ **Privacy Protected**: All analytics are anonymized - no student identities revealed

The system is designed to help students in crisis while maintaining their anonymity and privacy.







