import React, { useState } from 'react';

// Simple icon components to replace lucide-react
const ChevronLeft = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRight = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const Shield = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const Zap = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

const Brain = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
  </svg>
);

const AlertTriangle = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const CheckCircle = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const TrendingUp = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

// Inline Tailwind-compatible styles
const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
`;

const App = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    // Title Slide
    {
      title: "AI-Driven Automation in Incident Response",
      subtitle: "Revolutionizing Cybersecurity Through Intelligence and Speed",
      type: "title",
      content: null
    },
    
    // Agenda
    {
      title: "Session Agenda",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
            <div>
              <h3 className="font-semibold text-lg mb-1">The Evolution of Incident Response</h3>
              <p className="text-gray-600">Why traditional playbooks are no longer sufficient</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
            <div>
              <h3 className="font-semibold text-lg mb-1">AI-Driven Automation Fundamentals</h3>
              <p className="text-gray-600">Detection, containment, and dwell time reduction</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Real-World Applications & Case Studies</h3>
              <p className="text-gray-600">Threat hunting, SOAR, and ML-driven anomaly detection</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">4</div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Challenges & Solutions</h3>
              <p className="text-gray-600">AI biases, false positives, and human oversight</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">5</div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Implementation Roadmap</h3>
              <p className="text-gray-600">Actionable strategies for integration</p>
            </div>
          </div>
        </div>
      )
    },

    // Learning Objectives
    {
      title: "Learning Objectives",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-blue-500 flex-shrink-0 mt-1" size={24} />
              <p className="text-gray-800">Define AI-driven automation in incident response and explain how it enhances detection, containment, and dwell time reduction through real-world case studies</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-l-4 border-purple-500">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-purple-500 flex-shrink-0 mt-1" size={24} />
              <p className="text-gray-800">Identify key use cases for AI and automation in threat response, including threat hunting, malware analysis, and phishing response</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg border-l-4 border-green-500">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={24} />
              <p className="text-gray-800">Describe the challenges of integrating AI into IR workflows, including AI biases, false positives, and strategies for balancing automation with human oversight</p>
            </div>
          </div>
        </div>
      )
    },

    // The Problem
    {
      title: "The Challenge: Why Traditional IR Falls Short",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
              <h3 className="font-bold text-lg mb-3 text-red-800">Evolving Threat Landscape</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Sophisticated, polymorphic malware</li>
                <li>• Advanced persistent threats (APTs)</li>
                <li>• Zero-day exploits</li>
                <li>• Ransomware-as-a-Service</li>
              </ul>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
              <h3 className="font-bold text-lg mb-3 text-orange-800">Manual Response Limitations</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Average dwell time: 16-24 days</li>
                <li>• Alert fatigue in SOC teams</li>
                <li>• Slow investigation processes</li>
                <li>• Human error and inconsistency</li>
              </ul>
            </div>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-300">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="text-yellow-600" size={28} />
              <h3 className="font-bold text-lg text-yellow-800">The Critical Gap</h3>
            </div>
            <p className="text-gray-700 text-lg">Traditional playbooks are static and reactive, while modern threats are dynamic and proactive. Organizations need intelligent, adaptive response mechanisms that can match threat actors' speed and sophistication.</p>
          </div>
        </div>
      )
    },

    // AI-Driven Automation Overview
    {
      title: "What is AI-Driven Automation in IR?",
      type: "content",
      content: (
        <div className="space-y-6">
          <p className="text-xl text-gray-700 italic">The integration of artificial intelligence and machine learning technologies to enhance, accelerate, and optimize incident response workflows through intelligent automation.</p>
          
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
              <Brain className="mb-4" size={40} />
              <h3 className="font-bold text-lg mb-2">Intelligent Detection</h3>
              <p className="text-sm">ML algorithms identify anomalies and threats that traditional rules miss</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
              <Zap className="mb-4" size={40} />
              <h3 className="font-bold text-lg mb-2">Rapid Response</h3>
              <p className="text-sm">Automated containment and remediation in seconds, not hours</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
              <TrendingUp className="mb-4" size={40} />
              <h3 className="font-bold text-lg mb-2">Continuous Learning</h3>
              <p className="text-sm">Systems improve over time through feedback and pattern recognition</p>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg mt-6">
            <h3 className="font-bold text-lg mb-3">Key Technologies</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Machine Learning & Deep Learning</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Natural Language Processing (NLP)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Behavioral Analytics</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Automated Orchestration (SOAR)</span>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Three Pillars
    {
      title: "Three Pillars of AI-Enhanced IR",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 rounded-lg">
            <h3 className="font-bold text-2xl mb-4">1. Enhanced Detection</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-blue-100">Traditional Approach</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Signature-based detection</li>
                  <li>• Static rule sets</li>
                  <li>• High false positive rates</li>
                  <li>• Misses unknown threats</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-blue-100">AI-Driven Approach</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Behavioral anomaly detection</li>
                  <li>• Pattern recognition across datasets</li>
                  <li>• Contextual threat intelligence</li>
                  <li>• Identifies zero-day exploits</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 bg-white/20 p-4 rounded">
              <p className="font-semibold">Impact: Up to 90% reduction in time-to-detection</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-3">2. Accelerated Containment</h3>
              <p className="text-sm mb-3">Automated response actions triggered instantly upon threat confirmation</p>
              <ul className="space-y-1 text-sm">
                <li>• Isolate compromised endpoints</li>
                <li>• Block malicious IPs/domains</li>
                <li>• Quarantine suspicious files</li>
                <li>• Disable compromised accounts</li>
              </ul>
              <div className="mt-4 bg-white/20 p-3 rounded">
                <p className="font-semibold text-sm">Containment: Minutes vs. Hours</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-3">3. Reduced Dwell Time</h3>
              <p className="text-sm mb-3">Time between compromise and detection dramatically shortened</p>
              <ul className="space-y-1 text-sm">
                <li>• Continuous monitoring</li>
                <li>• Real-time threat correlation</li>
                <li>• Proactive threat hunting</li>
                <li>• Automated investigation</li>
              </ul>
              <div className="mt-4 bg-white/20 p-3 rounded">
                <p className="font-semibold text-sm">Average Reduction: 80-95%</p>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // SOAR
    {
      title: "SOAR: The Automation Engine",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-lg border-2 border-indigo-300">
            <h3 className="font-bold text-2xl mb-2 text-indigo-900">Security Orchestration, Automation, and Response</h3>
            <p className="text-gray-700 text-lg">The technological backbone that connects security tools, automates workflows, and orchestrates coordinated response actions</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-lg shadow-md border-t-4 border-blue-500">
              <h4 className="font-bold text-lg mb-3 text-blue-700">Orchestration</h4>
              <p className="text-sm text-gray-600 mb-3">Connects disparate security tools into unified workflows</p>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• SIEM integration</li>
                <li>• EDR coordination</li>
                <li>• Firewall management</li>
                <li>• Threat intel feeds</li>
              </ul>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-md border-t-4 border-purple-500">
              <h4 className="font-bold text-lg mb-3 text-purple-700">Automation</h4>
              <p className="text-sm text-gray-600 mb-3">Executes repeatable tasks without human intervention</p>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Alert triage</li>
                <li>• Data enrichment</li>
                <li>• Containment actions</li>
                <li>• Evidence collection</li>
              </ul>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-md border-t-4 border-green-500">
              <h4 className="font-bold text-lg mb-3 text-green-700">Response</h4>
              <p className="text-sm text-gray-600 mb-3">Executes coordinated incident response actions</p>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Playbook execution</li>
                <li>• Threat neutralization</li>
                <li>• Stakeholder notification</li>
                <li>• Forensic documentation</li>
              </ul>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
            <h4 className="font-bold text-lg mb-2 text-green-800">Key Benefits</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
              <div>• Reduces analyst workload by 50-70%</div>
              <div>• Standardizes response procedures</div>
              <div>• Improves response consistency</div>
              <div>• Scales security operations efficiently</div>
            </div>
          </div>
        </div>
      )
    },

    // Use Cases
    {
      title: "Key Use Cases for AI & Automation",
      type: "content",
      content: (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
            <h3 className="font-bold text-xl mb-3">1. AI-Assisted Threat Hunting</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold mb-2 text-blue-100">Capabilities</p>
                <ul className="space-y-1">
                  <li>• Proactive threat discovery</li>
                  <li>• Hypothesis-driven investigation</li>
                  <li>• IOC correlation at scale</li>
                  <li>• Behavioral pattern analysis</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2 text-blue-100">AI Enhancement</p>
                <ul className="space-y-1">
                  <li>• Suggests hunting hypotheses</li>
                  <li>• Automates data collection</li>
                  <li>• Identifies hidden relationships</li>
                  <li>• Prioritizes findings by risk</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-300">
              <h3 className="font-bold text-lg mb-3 text-purple-800">2. Automated Malware Analysis</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><span className="font-semibold">Static Analysis:</span> Automated code decompilation and signature extraction</li>
                <li><span className="font-semibold">Dynamic Analysis:</span> Sandbox execution with behavioral monitoring</li>
                <li><span className="font-semibold">ML Classification:</span> Family identification and similarity scoring</li>
                <li><span className="font-semibold">Impact:</span> Analysis time reduced from hours to minutes</li>
              </ul>
            </div>

            <div className="bg-green-50 p-5 rounded-lg border-2 border-green-300">
              <h3 className="font-bold text-lg mb-3 text-green-800">3. Intelligent Phishing Response</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><span className="font-semibold">Detection:</span> NLP analysis of email content and headers</li>
                <li><span className="font-semibold">Validation:</span> URL/attachment reputation checks</li>
                <li><span className="font-semibold">Remediation:</span> Auto-delete from all mailboxes</li>
                <li><span className="font-semibold">Impact:</span> 95%+ detection accuracy with sub-minute response</li>
              </ul>
            </div>
          </div>

          <div className="bg-orange-50 p-5 rounded-lg border-2 border-orange-300">
            <h3 className="font-bold text-lg mb-3 text-orange-800">4. Anomaly Detection & User Behavior Analytics</h3>
            <p className="text-sm text-gray-700 mb-2">ML models establish normal behavior baselines and detect deviations indicative of compromise</p>
            <div className="grid grid-cols-3 gap-3 text-sm text-gray-700">
              <div>• Unusual access patterns</div>
              <div>• Privilege escalation</div>
              <div>• Data exfiltration</div>
              <div>• Lateral movement</div>
              <div>• Compromised credentials</div>
              <div>• Insider threats</div>
            </div>
          </div>
        </div>
      )
    },

    // Case Study 1
    {
      title: "Case Study: Financial Services Ransomware",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-lg">
            <h3 className="font-bold text-2xl mb-2">The Incident</h3>
            <p className="text-lg">Large financial institution faced sophisticated ransomware attack targeting critical infrastructure</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
              <h4 className="font-bold text-lg mb-4 text-red-800">Traditional Response (Simulated)</h4>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <p className="font-semibold">Detection:</p>
                  <p>6 hours after initial compromise</p>
                </div>
                <div>
                  <p className="font-semibold">Investigation:</p>
                  <p>8-12 hours to understand scope</p>
                </div>
                <div>
                  <p className="font-semibold">Containment:</p>
                  <p>4-6 hours manual isolation</p>
                </div>
                <div>
                  <p className="font-semibold">Total Impact:</p>
                  <p className="text-red-700 font-bold">300+ systems encrypted, $2.5M loss</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-lg mb-4 text-green-800">AI-Driven Response (Actual)</h4>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <p className="font-semibold">Detection:</p>
                  <p>12 minutes via behavioral anomaly ML</p>
                </div>
                <div>
                  <p className="font-semibold">Investigation:</p>
                  <p>18 minutes automated analysis</p>
                </div>
                <div>
                  <p className="font-semibold">Containment:</p>
                  <p>8 minutes SOAR-orchestrated isolation</p>
                </div>
                <div>
                  <p className="font-semibold">Total Impact:</p>
                  <p className="text-green-700 font-bold">12 systems affected, $180K loss</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-300">
            <h4 className="font-bold text-lg mb-3 text-blue-800">Key Success Factors</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="font-semibold mb-1">ML Anomaly Detection</p>
                <p>Identified unusual file encryption patterns immediately</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Automated Containment</p>
                <p>SOAR playbook isolated affected segments in minutes</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Threat Intelligence</p>
                <p>AI correlated IOCs with known ransomware families</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Rapid Recovery</p>
                <p>Automated backup restoration reduced downtime by 85%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-100 to-teal-100 p-5 rounded-lg">
            <p className="text-center text-xl font-bold text-gray-800">93% reduction in impact | 96% faster response time</p>
          </div>
        </div>
      )
    },

    // Case Study 2
    {
      title: "Case Study: Healthcare APT Detection",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-lg">
            <h3 className="font-bold text-2xl mb-2">The Incident</h3>
            <p className="text-lg">Healthcare provider discovered nation-state APT exfiltrating patient data for 3+ months</p>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
            <h4 className="font-bold text-lg mb-3 text-yellow-800">The Challenge</h4>
            <p className="text-gray-700">Advanced persistent threat used living-off-the-land techniques, legitimate credentials, and slow exfiltration to evade traditional detection</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="font-bold text-lg mb-4 text-purple-700">AI-Powered Discovery</h4>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">1.</span>
                  <div>
                    <p className="font-semibold">UEBA Baseline Analysis</p>
                    <p>ML models detected subtle deviations in administrator account usage patterns</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">2.</span>
                  <div>
                    <p className="font-semibold">Network Traffic Anomaly</p>
                    <p>AI identified unusual encrypted DNS tunneling during off-hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">3.</span>
                  <div>
                    <p className="font-semibold">Automated Threat Hunting</p>
                    <p>System generated hypothesis and investigated historical data</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="font-bold text-lg mb-4 text-indigo-700">Automated Response</h4>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">1.</span>
                  <div>
                    <p className="font-semibold">Forensic Data Collection</p>
                    <p>Automated capture of memory, logs, and network traffic</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">2.</span>
                  <div>
                    <p className="font-semibold">IOC Extraction & Blocking</p>
                    <p>AI identified and blocked 47 related indicators</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">3.</span>
                  <div>
                    <p className="font-semibold">Credential Reset & Access Review</p>
                    <p>SOAR orchestrated organization-wide security updates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-400">
            <h4 className="font-bold text-lg mb-3 text-green-800">Outcomes</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-green-600">4.5 hrs</p>
                <p className="text-sm text-gray-600">From detection to full containment</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">Zero</p>
                <p className="text-sm text-gray-600">Patient records compromised post-detection</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">$4.2M</p>
                <p className="text-sm text-gray-600">Estimated breach cost avoided</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-5 rounded-lg">
            <p className="text-sm italic text-gray-700"><span className="font-semibold">Key Insight:</span> AI-driven behavioral analytics detected sophisticated threats that evaded signature-based and rule-based detection systems for months. The automated response prevented further compromise while analysts focused on threat intelligence and remediation strategy.</p>
          </div>
        </div>
      )
    },

    // Challenges
    {
      title: "Challenges in AI-Driven IR",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
            <h3 className="font-bold text-xl mb-4 text-red-800 flex items-center gap-2">
              <AlertTriangle size={24} />
              Challenge 1: AI Biases & Training Data Issues
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold mb-2 text-gray-700">The Problem</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Models trained on historical data may miss novel attacks</li>
                  <li>• Bias toward majority attack types</li>
                  <li>• Underrepresentation of rare but critical threats</li>
                  <li>• Geographic or industry-specific blind spots</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2 text-gray-700">Mitigation Strategies</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Diverse, representative training datasets</li>
                  <li>• Regular model retraining and validation</li>
                  <li>• Synthetic data generation for rare scenarios</li>
                  <li>• Continuous monitoring of model performance</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
            <h3 className="font-bold text-xl mb-4 text-orange-800">Challenge 2: False Positives & Alert Fatigue</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-orange-200 rounded px-3 py-1 font-bold text-orange-800">Issue</div>
                <p className="text-gray-700 flex-1">Overly sensitive AI models generate excessive alerts, leading to analyst burnout and missed genuine threats</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="font-semibold mb-1 text-orange-700">Tuning</p>
                  <p className="text-gray-600">Optimize detection thresholds based on organizational risk tolerance</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="font-semibold mb-1 text-orange-700">Contextualization</p>
                  <p className="text-gray-600">Enrich alerts with business context to reduce false positives</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="font-semibold mb-1 text-orange-700">Feedback Loops</p>
                  <p className="text-gray-600">Analyst feedback continuously improves model accuracy</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
            <h3 className="font-bold text-xl mb-4 text-purple-800">Challenge 3: The Black Box Problem</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="font-semibold mb-2 text-gray-700">Why It Matters</p>
                <p className="text-sm text-gray-600 mb-3">Complex ML models often lack transparency, making it difficult for analysts to understand why certain decisions were made</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Compliance and audit requirements</li>
                  <li>• Trust and adoption barriers</li>
                  <li>• Difficulty in debugging errors</li>
                  <li>• Legal and regulatory implications</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2 text-gray-700">Solutions</p>
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded text-sm">
                    <p className="font-semibold text-purple-700">Explainable AI (XAI)</p>
                    <p className="text-gray-600">Implement interpretable models and visualization tools</p>
                  </div>
                  <div className="bg-white p-3 rounded text-sm">
                    <p className="font-semibold text-purple-700">Decision Provenance</p>
                    <p className="text-gray-600">Document the reasoning behind automated actions</p>
                  </div>
                  <div className="bg-white p-3 rounded text-sm">
                    <p className="font-semibold text-purple-700">Human Review</p>
                    <p className="text-gray-600">Critical decisions require analyst validation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
            <h3 className="font-bold text-xl mb-3 text-yellow-800">Challenge 4: Data Quality & Integration</h3>
            <p className="text-sm text-gray-700 mb-4">AI systems are only as good as the data they receive. Poor data quality, siloed systems, and integration challenges can severely limit effectiveness.</p>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="text-center">
                <p className="font-bold text-yellow-700">Incomplete Logs</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-yellow-700">Inconsistent Formats</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-yellow-700">Tool Sprawl</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-yellow-700">Legacy Systems</p>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Human-AI Balance
    {
      title: "Striking the Right Balance: Human + AI",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-8 rounded-lg text-center">
            <h3 className="font-bold text-3xl mb-3">The Optimal Model: Augmented Intelligence</h3>
            <p className="text-xl">AI handles speed and scale. Humans provide judgment and creativity.</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-300">
              <h4 className="font-bold text-xl mb-4 text-blue-800">What AI Does Best</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <div>
                    <p className="font-semibold text-gray-800">High-Volume Data Processing</p>
                    <p className="text-sm text-gray-600">Analyze millions of events per second</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <div>
                    <p className="font-semibold text-gray-800">Pattern Recognition</p>
                    <p className="text-sm text-gray-600">Identify anomalies across vast datasets</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <div>
                    <p className="font-semibold text-gray-800">Repetitive Tasks</p>
                    <p className="text-sm text-gray-600">Consistent execution of defined workflows</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">4</div>
                  <div>
                    <p className="font-semibold text-gray-800">Speed & Availability</p>
                    <p className="text-sm text-gray-600">24/7 monitoring without fatigue</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">5</div>
                  <div>
                    <p className="font-semibold text-gray-800">Initial Triage</p>
                    <p className="text-sm text-gray-600">Quick assessment and prioritization</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-300">
              <h4 className="font-bold text-xl mb-4 text-green-800">What Humans Do Best</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <div>
                    <p className="font-semibold text-gray-800">Contextual Understanding</p>
                    <p className="text-sm text-gray-600">Business impact and organizational nuance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <div>
                    <p className="font-semibold text-gray-800">Strategic Thinking</p>
                    <p className="text-sm text-gray-600">Long-term implications and adversary intent</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <div>
                    <p className="font-semibold text-gray-800">Creative Problem-Solving</p>
                    <p className="text-sm text-gray-600">Novel attack scenarios and edge cases</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">4</div>
                  <div>
                    <p className="font-semibold text-gray-800">Ethical Judgment</p>
                    <p className="text-sm text-gray-600">Moral implications of response actions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">5</div>
                  <div>
                    <p className="font-semibold text-gray-800">Communication</p>
                    <p className="text-sm text-gray-600">Stakeholder management and coordination</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-lg border-2 border-indigo-300">
            <h4 className="font-bold text-lg mb-4 text-center text-indigo-900">The Human-in-the-Loop Framework</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-4 rounded shadow">
                <p className="font-bold text-blue-700 mb-2">Tier 1: Fully Automated</p>
                <p className="text-gray-600 text-xs mb-2">Low-risk, high-confidence actions</p>
                <p className="text-gray-700">Examples: Block known malicious IPs, quarantine confirmed malware</p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <p className="font-bold text-purple-700 mb-2">Tier 2: Human-Supervised</p>
                <p className="text-gray-600 text-xs mb-2">Moderate risk, analyst approval</p>
                <p className="text-gray-700">Examples: Isolate suspected compromised host, disable user account</p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <p className="font-bold text-green-700 mb-2">Tier 3: Human-Led</p>
                <p className="text-gray-600 text-xs mb-2">High-risk, critical decisions</p>
                <p className="text-gray-700">Examples: Initiate service shutdown, external breach notification</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-5 rounded-lg border-l-4 border-yellow-500">
            <p className="text-gray-800 italic"><span className="font-bold">Key Principle:</span> Automation should empower analysts, not replace them. The goal is to eliminate mundane tasks so security professionals can focus on complex analysis, threat intelligence, and strategic defense improvements.</p>
          </div>
        </div>
      )
    },

    // Implementation Roadmap
    {
      title: "Implementation Roadmap",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-lg">
            <h3 className="font-bold text-2xl mb-2">From Strategy to Reality</h3>
            <p className="text-lg">A phased approach to integrating AI-driven automation into incident response workflows</p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">1</div>
                <h4 className="font-bold text-xl text-blue-800">Assessment & Planning (1-2 months)</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold mb-2 text-gray-700">Current State Analysis</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Audit existing security tools and data sources</li>
                    <li>• Evaluate current IR process maturity</li>
                    <li>• Identify pain points and bottlenecks</li>
                    <li>• Assess team skills and training needs</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2 text-gray-700">Define Objectives</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Set measurable goals (MTTD, MTTR, etc.)</li>
                    <li>• Prioritize use cases by impact</li>
                    <li>• Establish success criteria</li>
                    <li>• Determine budget and resources</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">2</div>
                <h4 className="font-bold text-xl text-purple-800">Foundation Building (2-4 months)</h4>
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="font-semibold text-purple-700 mb-1">Data Infrastructure</p>
                  <p className="text-gray-600">Centralize logging, standardize formats, ensure data quality and completeness</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="font-semibold text-purple-700 mb-1">Tool Integration</p>
                  <p className="text-gray-600">Connect security tools via APIs, establish SOAR platform, configure orchestration</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="font-semibold text-purple-700 mb-1">Baseline Establishment</p>
                  <p className="text-gray-600">Collect normal behavior data, train initial ML models, validate accuracy</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">3</div>
                <h4 className="font-bold text-xl text-green-800">Pilot Implementation (3-6 months)</h4>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-white p-4 rounded">
                  <p className="font-semibold text-green-700 mb-2">Start Small</p>
                  <p className="text-gray-600">Begin with one high-value, low-risk use case (e.g., automated phishing response)</p>
                </div>
                <div className="bg-white p-4 rounded">
                  <p className="font-semibold text-green-700 mb-2">Monitor Closely</p>
                  <p className="text-gray-600">Track metrics, gather analyst feedback, tune detection thresholds</p>
                </div>
                <div className="bg-white p-4 rounded">
                  <p className="font-semibold text-green-700 mb-2">Iterate Quickly</p>
                  <p className="text-gray-600">Refine playbooks, adjust automation rules, improve model performance</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">4</div>
                <h4 className="font-bold text-xl text-orange-800">Scale & Optimize (6-12 months)</h4>
              </div>
              <p className="text-sm text-gray-700 mb-3">Expand automation to additional use cases based on pilot success</p>
              <div className="grid grid-cols-4 gap-2 text-xs text-center">
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="font-semibold text-orange-700">Malware Analysis</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="font-semibold text-orange-700">Threat Hunting</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="font-semibold text-orange-700">Anomaly Detection</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="font-semibold text-orange-700">UEBA</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-indigo-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">5</div>
                <h4 className="font-bold text-xl text-indigo-800">Continuous Improvement (Ongoing)</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>• Regular model retraining with new threat data</div>
                <div>• Quarterly playbook reviews and updates</div>
                <div>• Ongoing analyst training and skill development</div>
                <div>• Benchmark against industry metrics</div>
                <div>• Integration of emerging AI capabilities</div>
                <div>• Red team exercises to test automation</div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Best Practices
    {
      title: "Best Practices for Success",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4">Start with Quick Wins</h3>
              <p className="text-sm mb-3">Build momentum and prove value early</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Automate high-volume, low-complexity tasks first</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Focus on use cases with clear ROI</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Celebrate and communicate early successes</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4">Invest in Data Quality</h3>
              <p className="text-sm mb-3">Garbage in, garbage out applies doubly to AI</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Ensure comprehensive log collection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Standardize data formats and schemas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Implement data validation and cleansing</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4">Maintain Human Oversight</h3>
              <p className="text-sm mb-3">Never fully abdicate decision-making to machines</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Implement approval workflows for high-risk actions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Regular audit of automated decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Maintain kill switches and override capabilities</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-lg">
              <h3 className="font-bold text-xl mb-4">Foster Analyst Buy-In</h3>
              <p className="text-sm mb-3">AI augments, doesn't replace security teams</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Involve analysts in design and tuning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Provide comprehensive training</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Show how automation elevates their work</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-lg border-2 border-yellow-400">
            <h3 className="font-bold text-xl mb-4 text-gray-800">Additional Success Factors</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-yellow-800 mb-1">Measure Everything</p>
                <p className="text-gray-700">Track MTTD, MTTR, false positive rates, analyst productivity</p>
              </div>
              <div>
                <p className="font-semibold text-yellow-800 mb-1">Document Thoroughly</p>
                <p className="text-gray-700">Maintain playbook documentation, decision rationale, and lessons learned</p>
              </div>
              <div>
                <p className="font-semibold text-yellow-800 mb-1">Test Regularly</p>
                <p className="text-gray-700">Conduct tabletop exercises and simulate attacks to validate automation</p>
              </div>
              <div>
                <p className="font-semibold text-yellow-800 mb-1">Stay Current</p>
                <p className="text-gray-700">Monitor threat landscape evolution and update models accordingly</p>
              </div>
              <div>
                <p className="font-semibold text-yellow-800 mb-1">Build Partnerships</p>
                <p className="text-gray-700">Collaborate with vendors, peers, and threat intelligence communities</p>
              </div>
              <div>
                <p className="font-semibold text-yellow-800 mb-1">Plan for Scale</p>
                <p className="text-gray-700">Design infrastructure to handle growth in data volume and complexity</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-5 rounded-lg border-l-4 border-red-500">
            <h4 className="font-bold text-lg mb-2 text-red-800">Common Pitfalls to Avoid</h4>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <div>❌ Over-automating before proper testing</div>
              <div>❌ Neglecting to retrain models regularly</div>
              <div>❌ Ignoring analyst feedback on false positives</div>
              <div>❌ Failing to integrate with existing workflows</div>
              <div>❌ Underestimating change management needs</div>
              <div>❌ Expecting perfection from day one</div>
            </div>
          </div>
        </div>
      )
    },

    // Metrics & ROI
    {
      title: "Measuring Success: Key Metrics & ROI",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 rounded-lg">
            <h3 className="font-bold text-2xl mb-2">Quantifying the Impact of AI-Driven IR</h3>
            <p className="text-lg">Track these metrics to demonstrate value and guide optimization</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-400">
              <h4 className="font-bold text-lg mb-4 text-green-800">Speed Metrics</h4>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="font-bold text-green-700">Mean Time to Detect (MTTD)</p>
                  <p className="text-sm text-gray-600 mb-1">Time from compromise to detection</p>
                  <p className="text-2xl font-bold text-green-600">Target: &lt;15 minutes</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="font-bold text-green-700">Mean Time to Respond (MTTR)</p>
                  <p className="text-sm text-gray-600 mb-1">Time from detection to containment</p>
                  <p className="text-2xl font-bold text-green-600">Target: &lt;30 minutes</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="font-bold text-green-700">Dwell Time</p>
                  <p className="text-sm text-gray-600 mb-1">Time attacker remains undetected</p>
                  <p className="text-2xl font-bold text-green-600">Target: &lt;1 hour</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-400">
              <h4 className="font-bold text-lg mb-4 text-blue-800">Accuracy Metrics</h4>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="font-bold text-blue-700">Detection Accuracy</p>
                  <p className="text-sm text-gray-600 mb-1">Percentage of true threats identified</p>
                  <p className="text-2xl font-bold text-blue-600">Target: &gt;95%</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="font-bold text-blue-700">False Positive Rate</p>
                  <p className="text-sm text-gray-600 mb-1">Benign events flagged as threats</p>
                  <p className="text-2xl font-bold text-blue-600">Target: &lt;5%</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="font-bold text-blue-700">Alert Fidelity</p>
                  <p className="text-sm text-gray-600 mb-1">Percentage of alerts requiring action</p>
                  <p className="text-2xl font-bold text-blue-600">Target: &gt;80%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-400">
              <h4 className="font-bold text-lg mb-3 text-purple-800">Efficiency Metrics</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Alerts processed per analyst</li>
                <li>• Automation rate (%)</li>
                <li>• Manual investigation time saved</li>
                <li>• Incident closure rate</li>
              </ul>
            </div>

            <div className="bg-orange-50 p-5 rounded-lg border-2 border-orange-400">
              <h4 className="font-bold text-lg mb-3 text-orange-800">Business Impact</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Reduced breach costs</li>
                <li>• Prevented data loss (records)</li>
                <li>• Minimized downtime</li>
                <li>• Compliance improvements</li>
              </ul>
            </div>

            <div className="bg-teal-50 p-5 rounded-lg border-2 border-teal-400">
              <h4 className="font-bold text-lg mb-3 text-teal-800">Team Metrics</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Analyst satisfaction scores</li>
                <li>• Burnout/turnover reduction</li>
                <li>• Skill development progress</li>
                <li>• Collaboration effectiveness</li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-lg border-2 border-green-400">
            <h4 className="font-bold text-xl mb-4 text-center text-green-800">Example ROI Calculation</h4>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cost Avoidance</p>
                <p className="text-3xl font-bold text-green-700">$3.2M</p>
                <p className="text-xs text-gray-500">Prevented breach costs annually</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Implementation Cost</p>
                <p className="text-3xl font-bold text-gray-700">$450K</p>
                <p className="text-xs text-gray-500">Platform, integration, training</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Net ROI</p>
                <p className="text-3xl font-bold text-blue-700">611%</p>
                <p className="text-xs text-gray-500">First year return</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-5 rounded-lg border-l-4 border-yellow-500">
            <h4 className="font-bold mb-2 text-gray-800">Additional Value Drivers</h4>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <div>• Reduced cyber insurance premiums</div>
              <div>• Improved regulatory compliance posture</div>
              <div>• Enhanced customer trust and retention</div>
              <div>• Competitive advantage in security maturity</div>
            </div>
          </div>
        </div>
      )
    },

    // Future Trends
    {
      title: "The Future of AI-Driven Incident Response",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-8 rounded-lg text-center">
            <h3 className="font-bold text-3xl mb-3">What's Next on the Horizon?</h3>
            <p className="text-xl">Emerging technologies shaping the future of cybersecurity</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg border-2 border-blue-300">
              <div className="flex items-center gap-3 mb-3">
                <Brain className="text-blue-600" size={32} />
                <h4 className="font-bold text-xl text-blue-800">Autonomous Security Operations</h4>
              </div>
              <p className="text-sm text-gray-700 mb-3">Self-healing systems that detect, investigate, contain, and remediate threats with minimal human intervention</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• End-to-end incident resolution</li>
                <li>• Self-optimizing playbooks</li>
                <li>• Predictive threat prevention</li>
                <li>• Autonomous threat hunting</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-lg border-2 border-purple-300">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="text-purple-600" size={32} />
                <h4 className="font-bold text-xl text-purple-800">Generative AI for Defense</h4>
              </div>
              <p className="text-sm text-gray-700 mb-3">Large language models revolutionizing threat intelligence and response coordination</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Natural language incident queries</li>
                <li>• Automated report generation</li>
                <li>• Intelligent playbook creation</li>
                <li>• Conversational security assistance</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-lg border-2 border-green-300">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="text-green-600" size={32} />
                <h4 className="font-bold text-xl text-green-800">Quantum-Resistant IR</h4>
              </div>
              <p className="text-sm text-gray-700 mb-3">Preparing incident response for post-quantum cryptography threats</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Quantum-safe encryption detection</li>
                <li>• Cryptographic agility automation</li>
                <li>• Harvest-now-decrypt-later defense</li>
                <li>• Next-gen forensic capabilities</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-lg border-2 border-orange-300">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="text-orange-600" size={32} />
                <h4 className="font-bold text-xl text-orange-800">Federated Threat Intelligence</h4>
              </div>
              <p className="text-sm text-gray-700 mb-3">Privacy-preserving AI collaboration across organizations for collective defense</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Cross-organization learning</li>
                <li>• Privacy-preserving analytics</li>
                <li>• Industry-wide threat correlation</li>
                <li>• Shared defense without data sharing</li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-lg border-2 border-indigo-300">
            <h4 className="font-bold text-xl mb-4 text-indigo-900">Additional Emerging Trends</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-4 rounded shadow-sm">
                <p className="font-semibold text-indigo-700 mb-2">Digital Twins for Security</p>
                <p className="text-gray-600">Virtual replicas of infrastructure for safe testing and simulation</p>
              </div>
              <div className="bg-white p-4 rounded shadow-sm">
                <p className="font-semibold text-purple-700 mb-2">Edge AI for IR</p>
                <p className="text-gray-600">Distributed intelligence for IoT and remote environment protection</p>
              </div>
              <div className="bg-white p-4 rounded shadow-sm">
                <p className="font-semibold text-pink-700 mb-2">Biometric Behavior Analysis</p>
                <p className="text-gray-600">Continuous authentication through typing patterns and interactions</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
            <h4 className="font-bold text-lg mb-2 text-gray-800">The Human Element Remains Critical</h4>
            <p className="text-gray-700">Despite technological advances, human creativity, ethical judgment, and strategic thinking will remain essential to effective cybersecurity. The future is not human vs. machine, but human + machine working in harmony.</p>
          </div>
        </div>
      )
    },

    // Key Takeaways
    {
      title: "Key Takeaways",
      type: "content",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 rounded-lg shadow-lg">
              <div className="flex items-start gap-4">
                <div className="bg-white text-blue-600 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-xl">1</div>
                <div>
                  <h3 className="font-bold text-2xl mb-2">AI-Driven Automation is Essential</h3>
                  <p className="text-lg">Traditional incident response cannot keep pace with modern threats. AI-driven automation dramatically improves detection speed, containment effectiveness, and reduces dwell time from days to minutes.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-8 rounded-lg shadow-lg">
              <div className="flex items-start gap-4">
                <div className="bg-white text-purple-600 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-xl">2</div>
                <div>
                  <h3 className="font-bold text-2xl mb-2">Multiple High-Impact Use Cases</h3>
                  <p className="text-lg">AI excels in threat hunting, malware analysis, phishing response, and anomaly detection. SOAR platforms orchestrate coordinated response actions across the security ecosystem at machine speed.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-8 rounded-lg shadow-lg">
              <div className="flex items-start gap-4">
                <div className="bg-white text-green-600 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-xl">3</div>
                <div>
                  <h3 className="font-bold text-2xl mb-2">Challenges Require Careful Management</h3>
                  <p className="text-lg">AI biases, false positives, and the black box problem are real concerns. Success requires diverse training data, continuous tuning, explainable AI, and maintaining appropriate human oversight.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-8 rounded-lg shadow-lg">
              <div className="flex items-start gap-4">
                <div className="bg-white text-orange-600 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-xl">4</div>
                <div>
                  <h3 className="font-bold text-2xl mb-2">Balance Technology with Human Expertise</h3>
                  <p className="text-lg">The optimal model is augmented intelligence—AI handles speed and scale while humans provide contextual understanding, strategic thinking, and ethical judgment. Neither can succeed alone.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-8 rounded-lg shadow-lg">
              <div className="flex items-start gap-4">
                <div className="bg-white text-indigo-600 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-xl">5</div>
                <div>
                  <h3 className="font-bold text-2xl mb-2">Phased Implementation Drives Success</h3>
                  <p className="text-lg">Start with assessment, build strong foundations, pilot with high-value use cases, scale based on success, and continuously improve. Quick wins build momentum and demonstrate ROI.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-100 to-amber-100 p-8 rounded-lg border-4 border-yellow-400">
            <h3 className="font-bold text-2xl mb-4 text-center text-gray-800">The Bottom Line</h3>
            <p className="text-xl text-center text-gray-800 leading-relaxed">
              Organizations that successfully integrate AI-driven automation into incident response workflows will detect threats faster, respond more effectively, and build more resilient security operations. The question is no longer <span className="font-bold italic">if</span> but <span className="font-bold italic">how quickly</span> your organization can adopt these capabilities.
            </p>
          </div>
        </div>
      )
    },

    // Q&A Slide
    {
      title: "Questions & Discussion",
      type: "content",
      content: (
        <div className="flex flex-col items-center justify-center h-full space-y-8">
          <div className="text-center">
            <h2 className="text-5xl font-bold text-gray-800 mb-4">Questions?</h2>
            <p className="text-2xl text-gray-600">Let's discuss AI-driven automation in incident response</p>
          </div>
          
          <div className="grid grid-cols-3 gap-6 w-full mt-12">
            <div className="bg-blue-50 p-6 rounded-lg text-center border-2 border-blue-300">
              <Shield className="mx-auto text-blue-600 mb-3" size={48} />
              <p className="font-semibold text-gray-800">Implementation Strategies</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg text-center border-2 border-purple-300">
              <Brain className="mx-auto text-purple-600 mb-3" size={48} />
              <p className="font-semibold text-gray-800">Technical Deep Dives</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg text-center border-2 border-green-300">
              <TrendingUp className="mx-auto text-green-600 mb-3" size={48} />
              <p className="font-semibold text-gray-800">ROI & Business Case</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-lg mt-8 text-center w-full">
            <p className="text-xl font-semibold">Thank you for your participation!</p>
            <p className="mt-2">Connect for further discussion on AI-driven incident response</p>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <>
      <style>{styles}</style>
      <div className="w-full h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-6xl bg-white rounded-lg shadow-2xl p-12 min-h-[600px] flex flex-col">
          {currentSlideData.type === "title" ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full">
                <Shield size={80} />
              </div>
              <h1 className="text-5xl font-bold text-gray-800 leading-tight">
                {currentSlideData.title}
              </h1>
              <p className="text-2xl text-gray-600 max-w-3xl">
                {currentSlideData.subtitle}
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-gray-800 mb-8 border-b-4 border-blue-500 pb-4">
                {currentSlideData.title}
              </h2>
              <div className="flex-1 overflow-y-auto">
                {currentSlideData.content}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-gray-800 text-white p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              currentSlide === 0
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide
                    ? "bg-blue-500 w-8"
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm">
              {currentSlide + 1} / {slides.length}
            </span>
            <button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                currentSlide === slides.length - 1
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default App;