# Escalation System

Complete guide to the crisis detection and escalation system in Lunavo.

## Overview

The Lunavo platform includes an automatic escalation system that detects posts showing signs of distress and routes them to appropriate counselors for intervention. The system also provides analytics for Student Affairs to identify trends and patterns.

## How It Works

### Automatic Detection

The system automatically scans posts for concerning content:

1. **Keyword Detection**: Scans for dangerous keywords and phrases
2. **Severity Assessment**: Assigns escalation level based on content
3. **Automatic Escalation**: Creates escalation record
4. **Counselor Notification**: Notifies appropriate counselors
5. **Intervention**: Counselor can reach out to student

### Escalation Levels

#### Critical Level
- **Keywords**: "suicide", "kill myself", "end my life", "want to die"
- **Action**: Immediate counselor notification
- **Post Status**: Hidden from public view
- **Response Time**: Immediate

#### High Level
- **Keywords**: Self-harm ("cutting", "hurting myself"), abuse ("raped", "assaulted", "threatened"), overdose
- **Action**: Urgent counselor assignment
- **Post Status**: Hidden from public view
- **Response Time**: Within hours

#### Medium Level
- **Keywords**: Severe depression, anxiety, substance abuse issues
- **Action**: Counselor review queue
- **Post Status**: Visible but flagged
- **Response Time**: Within 24 hours

#### Low Level
- **Keywords**: Academic stress, relationship problems, general mental health concerns
- **Action**: Peer support monitoring
- **Post Status**: Visible
- **Response Time**: Peer educator response

## Escalation Flow

```
User Posts → Auto-Detection → Escalation Created → Counselor Notified → Intervention
```

### For Critical/High Escalations:

1. Post is immediately flagged and hidden from public view
2. Counselor/Life Coach receives instant notification
3. Post author receives supportive message with crisis resources
4. Counselor can reach out through the platform's secure messaging
5. Meeting can be scheduled if needed

## Counselor Features

Counselors have access to:

### Escalation Dashboard

Located at `/counselor/escalations`:

- See all escalated posts in priority order
- Filter by escalation level
- View post details (anonymized)
- Mark escalations as resolved
- Add notes and interventions

### Post Details

- View the full post content (anonymized)
- See escalation level and reason
- View post history
- Access student's previous posts (if relevant)

### Direct Messaging

- Reach out to the student through the platform
- Send supportive messages
- Share resources
- Schedule meetings

### Meeting Booking

- Schedule in-person or virtual counseling sessions
- Send meeting invitations
- Manage meeting calendar
- Track meeting attendance

### Resource Sharing

- Share relevant support resources
- Recommend external services
- Provide crisis hotline numbers
- Link to helpful articles

## Student Affairs Dashboard

Student Affairs staff have access to anonymized analytics:

### Analytics Features

Located at `/student-affairs/dashboard`:

- **Trend Analysis**: See patterns in student concerns
- **Category Breakdown**: Identify which issues are most common
- **Peak Usage Times**: Understand when students need support most
- **Escalation Stats**: Track escalation rates and response times
- **Export Data**: Download anonymized reports

### What Student Affairs Can Do

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

### Privacy Protection

**Important**: Student Affairs **cannot see individual student identities**

- All data is aggregated and anonymized
- They see trends and patterns, not personal information
- This protects student privacy while allowing proactive support

## CUT Student Verification

To ensure only CUT students can access the platform:

1. **Email Verification**: User must verify their email address
2. **Student Number Verification**: User must provide their CUT student number
3. **Manual/API Verification**: (Can be integrated with CUT's student database)
   - Verify student number exists in CUT system
   - Confirm student is currently enrolled
   - Check student status (active, suspended, etc.)

**Current Implementation**:
- Student enters student number, name, department, and year
- System marks account as "verified" after submission
- **TODO**: Integrate with CUT's official student database API for real-time verification

## Contacting Students in Crisis

When a post is escalated:

### Through Platform Messaging

1. Counselor can send a direct message to the student
2. Message appears in student's notifications
3. Student can respond anonymously
4. Secure, private communication channel

### Meeting Booking

1. Counselor can create a meeting invitation
2. Student receives notification to book a session
3. Meeting details are shared securely
4. Calendar integration for scheduling

### Emergency Protocol

For Critical Escalations:

- If immediate danger is detected, system can:
  - Send urgent notification to on-call counselor
  - Provide crisis hotline numbers
  - Escalate to emergency services if needed (with proper authorization)

## Privacy & Anonymity Protection

### Student Privacy

- **Students remain anonymous** in all analytics
- **Student Affairs sees trends, not individuals**
- **Only counselors see escalated post content** (still anonymized)
- **No student IDs or personal info** in analytics
- **All data aggregated** to protect privacy

### Data Protection

- All communications are encrypted
- Student identities are protected
- Anonymized data only for analytics
- Compliance with privacy regulations

## Implementation Details

### Escalation Detection

Located in `lib/escalation-detection.ts`:

```typescript
import { detectEscalation } from '@/lib/escalation-detection';

const escalation = detectEscalation(postContent);
// Returns: { level: 'critical' | 'high' | 'medium' | 'low', keywords: [...] }
```

### Creating Escalations

```typescript
import { createEscalation } from '@/lib/database';

const escalation = await createEscalation({
  post_id: postId,
  level: 'critical',
  reason: 'Suicide-related keywords detected',
  detected_keywords: ['suicide', 'end my life'],
});
```

### Getting Escalations

```typescript
import { getEscalations } from '@/lib/database';

// Get all escalations for counselor
const escalations = await getEscalations({
  counselor_id: counselorId,
  status: 'pending',
});

// Get critical escalations
const critical = await getEscalations({
  level: 'critical',
  status: 'pending',
});
```

## Best Practices

### For Counselors

1. **Respond promptly** to critical/high escalations
2. **Document interventions** in escalation notes
3. **Follow up** with students after initial contact
4. **Use secure messaging** for all communications
5. **Respect student privacy** and anonymity

### For Student Affairs

1. **Use data responsibly** for planning and policy
2. **Respect privacy** - never try to identify individuals
3. **Act on trends** proactively
4. **Share insights** with counseling team
5. **Protect student data** at all times

## Additional Resources

- [Student Affairs Guide](../Getting-Started/ESCALATION_AND_STUDENT_AFFAIRS_GUIDE.md)
- [Authentication Documentation](Authentication.md)
- [Role-Based Navigation](Role-Based-Navigation.md)

---

**Last Updated**: December 2024
