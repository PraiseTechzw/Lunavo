/**
 * Student Affairs Reports Screen
 * Generate PDF reports with Chinhoyi University letterhead template
 * Division of Student Affairs - Drug and Substance Abuse and Life Skills Section
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebCard, WebContainer } from '@/components/web';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAnalytics, getEscalations } from '@/lib/database';
import { getCursorStyle } from '@/utils/platform-styles';
import { MaterialIcons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface ReportData {
  title: string;
  reportType: 'analytics' | 'escalations' | 'custom';
  dateRange: '7d' | '30d' | '90d' | 'custom' | 'all';
  customStartDate?: Date;
  customEndDate?: Date;
  description?: string;
  data?: any;
}

export default function StudentAffairsReportsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const reportContentRef = useRef<HTMLDivElement>(null);
  
  const { user, loading: authLoading } = useRoleGuard(['student-affairs', 'admin'], '/(tabs)');
  
  const [reportData, setReportData] = useState<ReportData>({
    title: '',
    reportType: 'analytics',
    dateRange: '30d',
    description: '',
  });
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [generating, setGenerating] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [escalations, setEscalations] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, reportData.dateRange]);

  const loadData = async () => {
    try {
      const [analyticsData, escalationsData] = await Promise.all([
        getAnalytics(),
        getEscalations(),
      ]);

      const now = new Date();
      let startDate: Date;
      switch (reportData.dateRange) {
        case '7d':
          startDate = subDays(now, 7);
          break;
        case '30d':
          startDate = subDays(now, 30);
          break;
        case '90d':
          startDate = subDays(now, 90);
          break;
        case 'custom':
          startDate = new Date(customStartDate);
          break;
        default:
          startDate = new Date(0);
      }

      const endDate = reportData.dateRange === 'custom' ? new Date(customEndDate) : now;

      const filteredEscalations = escalationsData.filter((e) => {
        const detectedDate = new Date(e.detectedAt);
        return detectedDate >= startDate && detectedDate <= endDate;
      });

      setAnalytics(analyticsData);
      setEscalations(filteredEscalations);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateReportHTML = (): string => {
    const now = new Date();
    let startDate: Date;
    switch (reportData.dateRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case 'custom':
        startDate = new Date(customStartDate);
        break;
      default:
        startDate = new Date(0);
    }

    const endDate = reportData.dateRange === 'custom' ? new Date(customEndDate) : now;
    const dateRangeText = reportData.dateRange === 'custom' 
      ? `${format(startDate, 'dd MMMM yyyy')} to ${format(endDate, 'dd MMMM yyyy')}`
      : reportData.dateRange === '7d' ? 'Last 7 Days'
      : reportData.dateRange === '30d' ? 'Last 30 Days'
      : reportData.dateRange === '90d' ? 'Last 90 Days'
      : 'All Time';

    let reportContent = '';
    
    if (reportData.reportType === 'analytics' && analytics) {
      reportContent = `
        <h2>Analytics Overview</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Total Posts</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${analytics.totalPosts || 0}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Active Users</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${analytics.activeUsers || 0}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Date Range</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${dateRangeText}</td>
          </tr>
        </table>
      `;
    } else if (reportData.reportType === 'escalations') {
      const resolved = escalations.filter(e => e.status === 'resolved').length;
      const pending = escalations.filter(e => e.status === 'pending' || e.status === 'in-progress').length;
      reportContent = `
        <h2>Escalation Summary</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Total Escalations</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${escalations.length}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Resolved</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${resolved}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Pending</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${pending}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Date Range</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${dateRangeText}</td>
          </tr>
        </table>
      `;
    }

    if (reportData.description) {
      reportContent += `
        <h2>Report Description</h2>
        <p style="line-height: 1.6; margin: 20px 0;">${reportData.description.replace(/\n/g, '<br>')}</p>
      `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${reportData.title || 'Student Affairs Report'}</title>
  <style>
    @media print {
      @page {
        margin: 0.5in;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    body {
      font-family: Arial, sans-serif;
      color: #000;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .letterhead {
      margin-bottom: 30px;
    }
    .letterhead-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    .logo-section {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .university-name-small {
      font-size: 10px;
      color: #008080;
      text-transform: uppercase;
      margin-bottom: 5px;
      font-weight: 600;
    }
    .logo-placeholder {
      width: 80px;
      height: 80px;
      border: 2px solid #D4AF37;
      border-radius: 50%;
      background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      text-align: center;
      padding: 5px;
      box-sizing: border-box;
    }
    .contact-info {
      text-align: right;
      font-size: 12px;
      line-height: 1.8;
      text-transform: uppercase;
      font-weight: 600;
    }
    .divider {
      border-top: 2px solid #000;
      margin: 15px 0;
    }
    .division-title {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 20px 0;
      letter-spacing: 1px;
    }
    .report-title {
      font-size: 24px;
      font-weight: bold;
      margin: 30px 0 20px 0;
      text-align: center;
    }
    .report-meta {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-bottom: 30px;
    }
    .report-content {
      margin-top: 30px;
    }
    h2 {
      font-size: 18px;
      font-weight: bold;
      margin-top: 25px;
      margin-bottom: 15px;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      border: 1px solid #ddd;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    p {
      margin: 15px 0;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="letterhead">
    <div class="letterhead-top">
      <div class="logo-section">
        <div class="university-name-small">CHINHOYI UNIVERSITY OF TECHNOLOGY</div>
        <div class="logo-placeholder">CUT<br>LOGO</div>
      </div>
      <div class="contact-info">
        CHINHOYI UNIVERSITY OF TECHNOLOGY<br>
        P BAG 7724, CHINHOYI, ZIMBABWE<br>
        PHONE: 263 67 22203-5<br>
        EXTENSION: 1297
      </div>
    </div>
    <div class="divider"></div>
    <div class="division-title">
      DIVISION OF STUDENT AFFAIRS - DRUG AND SUBSTANCE ABUSE AND LIFE SKILLS SECTION
    </div>
    <div class="divider"></div>
  </div>

  <div class="report-title">${reportData.title || 'Student Affairs Report'}</div>
  <div class="report-meta">
    Generated: ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}<br>
    Date Range: ${dateRangeText}
  </div>

  <div class="report-content">
    ${reportContent}
  </div>

  <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666;">
    This report contains anonymized data only. No student identities are disclosed.
  </div>
</body>
</html>
    `;
  };

  const generatePDF = () => {
    if (!isWeb) {
      Alert.alert('PDF Generation', 'PDF generation is only available on web.');
      return;
    }

    if (!reportData.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a report title.');
      return;
    }

    setGenerating(true);

    try {
      const htmlContent = generateReportHTML();
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load, then print
        setTimeout(() => {
          printWindow.print();
          setGenerating(false);
        }, 250);
      } else {
        Alert.alert('Error', 'Please allow pop-ups to generate PDF reports.');
        setGenerating(false);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
      setGenerating(false);
    }
  };

  const previewReport = () => {
    if (!isWeb) {
      Alert.alert('Preview', 'Preview is only available on web.');
      return;
    }

    if (!reportData.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a report title.');
      return;
    }

    const htmlContent = generateReportHTML();
    const previewWindow = window.open('', '_blank');
    
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    }
  };

  if (authLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const content = (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View>
          <ThemedText type="h1" style={[styles.pageTitle, { color: colors.text }]}>
            Generate Reports
          </ThemedText>
          <ThemedText type="body" style={[styles.pageSubtitle, { color: colors.icon }]}>
            Create official reports with university letterhead
          </ThemedText>
        </View>
      </View>

      {/* Report Configuration */}
      <WebCard style={styles.configCard}>
        <ThemedText type="h3" style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.lg }]}>
          Report Configuration
        </ThemedText>

        {/* Report Title */}
        <View style={styles.inputGroup}>
          <ThemedText type="body" style={[styles.label, { color: colors.text }]}>
            Report Title *
          </ThemedText>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Enter report title..."
            placeholderTextColor={colors.icon}
            value={reportData.title}
            onChangeText={(text) => setReportData({ ...reportData, title: text })}
          />
        </View>

        {/* Report Type */}
        <View style={styles.inputGroup}>
          <ThemedText type="body" style={[styles.label, { color: colors.text }]}>
            Report Type
          </ThemedText>
          <View style={styles.radioGroup}>
            {[
              { value: 'analytics', label: 'Analytics Overview', icon: 'analytics' },
              { value: 'escalations', label: 'Escalation Summary', icon: 'warning' },
              { value: 'custom', label: 'Custom Report', icon: 'description' },
            ].map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.radioOption,
                  {
                    backgroundColor: reportData.reportType === type.value ? colors.primary + '20' : colors.surface,
                    borderColor: reportData.reportType === type.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setReportData({ ...reportData, reportType: type.value as any })}
              >
                <MaterialIcons
                  name={type.icon as any}
                  size={20}
                  color={reportData.reportType === type.value ? colors.primary : colors.icon}
                />
                <ThemedText
                  type="body"
                  style={{
                    color: reportData.reportType === type.value ? colors.primary : colors.text,
                    fontWeight: reportData.reportType === type.value ? '600' : '400',
                    marginLeft: Spacing.sm,
                  }}
                >
                  {type.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.inputGroup}>
          <ThemedText type="body" style={[styles.label, { color: colors.text }]}>
            Date Range
          </ThemedText>
          <View style={styles.dateRangeContainer}>
            {(['7d', '30d', '90d', 'custom', 'all'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.dateRangeButton,
                  {
                    backgroundColor: reportData.dateRange === range ? colors.primary : colors.surface,
                    borderColor: reportData.dateRange === range ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setReportData({ ...reportData, dateRange: range })}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: reportData.dateRange === range ? '#FFFFFF' : colors.text,
                    fontWeight: '600',
                  }}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : range === 'custom' ? 'Custom' : 'All Time'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {reportData.dateRange === 'custom' && (
            <View style={styles.customDateContainer}>
              <View style={styles.dateInputGroup}>
                <ThemedText type="small" style={[styles.label, { color: colors.text }]}>
                  Start Date
                </ThemedText>
                <TextInput
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={customStartDate}
                  onChangeText={setCustomStartDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={styles.dateInputGroup}>
                <ThemedText type="small" style={[styles.label, { color: colors.text }]}>
                  End Date
                </ThemedText>
                <TextInput
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={customEndDate}
                  onChangeText={setCustomEndDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <ThemedText type="body" style={[styles.label, { color: colors.text }]}>
            Additional Notes / Description
          </ThemedText>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Enter any additional information or description for this report..."
            placeholderTextColor={colors.icon}
            value={reportData.description}
            onChangeText={(text) => setReportData({ ...reportData, description: text })}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>
      </WebCard>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.previewButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={previewReport}
          disabled={generating || !reportData.title.trim()}
        >
          <MaterialIcons name="visibility" size={20} color={colors.primary} />
          <ThemedText type="body" style={{ color: colors.primary, fontWeight: '600', marginLeft: Spacing.sm }}>
            Preview
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.generateButton,
            {
              backgroundColor: generating || !reportData.title.trim() ? colors.surface : colors.primary,
              opacity: generating || !reportData.title.trim() ? 0.5 : 1,
            },
          ]}
          onPress={generatePDF}
          disabled={generating || !reportData.title.trim()}
        >
          <MaterialIcons name="picture-as-pdf" size={20} color="#FFFFFF" />
          <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: Spacing.sm }}>
            {generating ? 'Generating...' : 'Generate PDF'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <WebCard style={styles.infoCard}>
        <MaterialIcons name="info-outline" size={24} color={colors.info} />
        <View style={styles.infoContent}>
          <ThemedText type="body" style={[styles.infoTitle, { color: colors.text }]}>
            Report Generation
          </ThemedText>
          <ThemedText type="small" style={[styles.infoText, { color: colors.icon }]}>
            Reports are generated with the official Chinhoyi University of Technology letterhead. 
            All data is anonymized and contains no student identities. Use the preview function 
            to review the report before generating the PDF.
          </ThemedText>
        </View>
      </WebCard>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );

  if (isWeb) {
    return (
      <ThemedView style={styles.container}>
        <WebContainer maxWidth={1200} padding={32}>
          {content}
        </WebContainer>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {content}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isWeb ? 0 : Spacing.md,
    paddingBottom: isWeb ? Spacing.xxl : 80,
  },
  pageHeader: {
    marginBottom: Spacing.xl,
    ...(isWeb ? {
      marginTop: Spacing.lg,
    } : {}),
  },
  pageTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 32 : 24,
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: isWeb ? 16 : 14,
  },
  configCard: {
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
    fontSize: 14,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 48,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 120,
  },
  radioGroup: {
    gap: Spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...getCursorStyle(),
  },
  dateRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dateRangeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...getCursorStyle(),
  },
  customDateContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    ...(isWeb ? {} : {
      flexDirection: 'column',
    }),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...getCursorStyle(),
  },
  previewButton: {
    ...(isWeb ? {} : {
      marginBottom: Spacing.sm,
    }),
  },
  generateButton: {
    borderWidth: 0,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: isWeb ? 20 : 18,
  },
});

