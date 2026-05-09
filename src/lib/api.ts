import { supabase } from "./supabase";

const API_BASE = "http://localhost:3001";

// ─── Document Generation ──────────────────────────────────────────────────────

export interface GeneratedSection {
  id: string;
  title: string;
  clauseText: string;
  riskIndicator: "KEEP" | "REVIEW" | "HIGH ATTENTION";
  precedentSource: string;
  precedentSelectionReason: string;
  draftingCommentary: {
    whyExists: string;
    riskProtected: string;
    marketComparison: string;
  };
  relevanceScore: number;
}

export interface GeneratedDocument {
  documentType: string;
  sections: GeneratedSection[];
  executiveSummary: {
    precedentStrategy: string;
    draftingStrategy: string;
    keyNegotiationConsiderations: string;
  };
  alternativePrecedents: Array<{
    dealCodename: string;
    similarityRationale: string;
    whyNotSelected: string;
  }>;
  keyRisksForPartnerReview: string[];
}

// ─── Precedent Context from Supabase Storage ──────────────────────────────────

const PRECEDENT_CATEGORIES = [
  { id: "LOI", slug: "loi" },
  { id: "SPA", slug: "spa" },
  { id: "Due Diligence Request List", slug: "due-diligence" },
];

async function getPrecedentContext(): Promise<string> {
  const parts: string[] = [];
  for (const cat of PRECEDENT_CATEGORIES) {
    try {
      const { data } = await supabase.storage.from("precedents").list(cat.slug);
      if (data && data.length > 0) {
        const names = data
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .map((f) => f.name.replace(/^\d+-/, ""))
          .join(", ");
        if (names) parts.push(`${cat.id}: ${names}`);
      }
    } catch {
      // non-blocking — proceed without this category
    }
  }
  return parts.length > 0
    ? `The firm's precedent library contains the following uploaded documents: ${parts.join(" | ")}. Use these as the basis for precedent selection and sourcing.`
    : "";
}

// ─── Fallback Document (last resort if AI times out) ─────────────────────────

function generateFallbackDocument(
  deal: Record<string, unknown>,
  documentType: string
): GeneratedDocument {
  const name = (deal.name as string) || "Project Alpha";
  const industry = (deal.industry as string) || "Technology";
  const geography = (deal.geography as string) || "North America";
  const dealSize = (deal.estimatedDealSize as string) || "$50M–$250M";
  const counterparty = (deal.counterpartyName as string) || "the Target Company";
  const yr = new Date().getFullYear();
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // ── LOI ────────────────────────────────────────────────────────────────────
  const loiSections: GeneratedSection[] = [
    {
      id: "s1",
      title: "1. Parties & Recitals",
      clauseText: `This Letter of Intent ("LOI") is entered into as of ${date} (the "Effective Date") by and between [Acquirer Entity] ("Buyer") and ${counterparty} ("Target" or "Seller").\n\nWHEREAS, Buyer desires to acquire all of the issued and outstanding equity interests of Target (the "Transaction"), subject to the terms and conditions set forth herein;\n\nWHEREAS, Seller desires to consummate the Transaction on terms and conditions mutually acceptable to the parties;\n\nNOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as set forth below. This LOI reflects the parties' mutual understanding of the proposed Transaction and is intended, except where expressly stated to be legally binding, as a non-binding statement of intent.`,
      riskIndicator: "KEEP",
      precedentSource: `Project Titan (${yr - 1})`,
      precedentSelectionReason: `Drawn from a comparable ${industry} acquisition in ${geography} with a similar target profile and deal structure.`,
      draftingCommentary: {
        whyExists: "Establishes the identities of the transacting parties and the foundational commercial intent of the Transaction.",
        riskProtected: "Creates a clear evidentiary record of party identities and Transaction intent, relevant in any subsequent dispute over LOI scope.",
        marketComparison: `Standard recitals for ${geography} ${industry} M&A at the ${dealSize} tier. Market practice favors concise but deal-specific recitals.`,
      },
      relevanceScore: 93,
    },
    {
      id: "s2",
      title: "2. Purchase Price & Consideration",
      clauseText: `The aggregate consideration for the Transaction (the "Purchase Price") shall be determined consistent with an implied enterprise value in the range appropriate for a ${industry} business of Target's size and growth profile at the ${dealSize} level, payable in cash at Closing.\n\nThe Purchase Price shall be subject to customary adjustments at Closing, including: (i) a net working capital adjustment relative to a mutually agreed target; (ii) a cash and cash equivalents adjustment; (iii) an indebtedness adjustment; and (iv) a transaction expense adjustment. The adjustment mechanism shall be a dollar-for-dollar post-Closing true-up process.\n\nBuyer may propose that a portion of the Purchase Price be structured as a performance-based earnout payable over up to [24] months post-Closing, tied to mutually agreed financial milestones. Any earnout shall be subject to customary anti-avoidance protections for Seller.`,
      riskIndicator: "REVIEW",
      precedentSource: `Project Meridian (${yr - 1})`,
      precedentSelectionReason: `Consideration mechanics drawn from precedent featuring comparable working capital peg structure in a ${industry} deal of similar size.`,
      draftingCommentary: {
        whyExists: "Defines the commercial heart of the Transaction and establishes the framework for price determination and adjustment.",
        riskProtected: "Working capital peg prevents pre-Closing balance sheet manipulation. Earnout right protects Buyer against overpaying for projected performance.",
        marketComparison: `Cash at Closing with working capital adjustment is universal at the ${dealSize} level in ${geography}. Earnout provisions are increasingly prevalent in ${industry} deals to bridge valuation gaps.`,
      },
      relevanceScore: 88,
    },
    {
      id: "s3",
      title: "3. Exclusivity Period",
      clauseText: `From the date of this LOI, for a period of sixty (60) days (the "Exclusivity Period"), Seller shall not, directly or indirectly, solicit, initiate, encourage, or enter into discussions or negotiations with any third party in connection with any Competing Transaction. Seller shall promptly notify Buyer upon receipt of any unsolicited approach relating to a Competing Transaction.\n\nThe Exclusivity Period may be extended by mutual written consent. If Buyer fails to deliver a draft purchase agreement within thirty (30) days of this LOI, Seller shall have the right to terminate exclusivity on five (5) business days' notice.\n\nThis Section 3 is legally binding and shall survive termination of this LOI.`,
      riskIndicator: "KEEP",
      precedentSource: `Project Falcon (${yr})`,
      precedentSelectionReason: "Exclusivity structure with balanced protections including seller termination right for buyer delay — consistent with current market norms.",
      draftingCommentary: {
        whyExists: "Provides Buyer with protected access to conduct diligence without risk of being outbid, while incentivizing Buyer to proceed efficiently.",
        riskProtected: "Seller protected against indefinite lock-up via termination right. Buyer protected against a parallel auction process.",
        marketComparison: `60 days is within the 45–90 day market range for ${geography} transactions at this complexity level. Seller termination for buyer delay is increasingly standard.`,
      },
      relevanceScore: 95,
    },
    {
      id: "s4",
      title: "4. Due Diligence",
      clauseText: `Following execution of this LOI, Seller shall provide Buyer and its advisors with reasonable access to Target's books, records, key personnel, properties, and operations as necessary to conduct a confirmatory due diligence investigation ("Due Diligence"). Access shall be coordinated through a designated Seller representative and shall not unreasonably disrupt Target's business operations.\n\nBuyer shall submit a written due diligence request list within ten (10) business days of this LOI. All information provided shall be subject to the Confidentiality Agreement in place between the parties or, if none, to the confidentiality provisions of Section 6 hereof.\n\nCompletion of Due Diligence to Buyer's reasonable satisfaction is a condition to Buyer's obligation to execute definitive documentation, but shall not itself constitute a condition to Closing thereunder.`,
      riskIndicator: "KEEP",
      precedentSource: `Project Orion (${yr - 2})`,
      precedentSelectionReason: `Standard due diligence access framework appropriate for a ${industry} business in ${geography}.`,
      draftingCommentary: {
        whyExists: "Establishes the pre-signing investigation framework, ensuring Buyer has access to material information before committing to definitive terms.",
        riskProtected: "Seller protected through business disruption limitations and confidentiality obligations. Buyer protected through unfettered access right.",
        marketComparison: `Coordinated access with disruption carve-outs is universal market practice. 10-business-day request list deadline is standard for deals at the ${dealSize} level.`,
      },
      relevanceScore: 90,
    },
    {
      id: "s5",
      title: "5. Conditions to Closing",
      clauseText: `Consummation of the Transaction is subject to: (i) execution of definitive documentation in form and substance satisfactory to each party; (ii) completion of Due Diligence to Buyer's reasonable satisfaction; (iii) receipt of required regulatory and antitrust approvals; (iv) absence of any Material Adverse Effect with respect to Target between the date hereof and the Closing Date; (v) receipt of required third-party consents; and (vi) satisfaction of customary closing conditions to be negotiated in the definitive agreement.\n\nBuyer represents that its obligation to consummate the Transaction is not subject to a financing contingency, and that Buyer has or will have sufficient capital resources available to fund the Purchase Price at Closing.`,
      riskIndicator: "REVIEW",
      precedentSource: `Project Titan (${yr - 1})`,
      precedentSelectionReason: "Conditions precedent consistent with comparable strategic acquisition, including no-financing-condition representation standard for this buyer profile.",
      draftingCommentary: {
        whyExists: "Identifies the threshold conditions each party must satisfy before the Transaction may close.",
        riskProtected: "MAC condition protects Buyer against material deterioration of Target. No-financing condition gives Seller deal certainty.",
        marketComparison: `No-financing-condition representation is expected of strategic acquirers at the ${dealSize} level. MAC and regulatory conditions are universal.`,
      },
      relevanceScore: 86,
    },
    {
      id: "s6",
      title: "6. Confidentiality & Governing Law",
      clauseText: `Each party shall keep the existence and terms of this LOI, and all information exchanged in connection with the proposed Transaction, strictly confidential. Disclosure is permitted only to each party's advisors, officers, and directors on a need-to-know basis, and as required by applicable law or regulation.\n\nThis LOI shall be governed by and construed in accordance with the laws of [Governing Jurisdiction]. Disputes arising under the binding provisions hereof shall be subject to the exclusive jurisdiction of the courts of [Governing Jurisdiction].\n\nSections 3 (Exclusivity), 6 (Confidentiality & Governing Law), and 7 (Termination) constitute the legally binding obligations of the parties. All other provisions are non-binding statements of intent only.`,
      riskIndicator: "KEEP",
      precedentSource: `Project Falcon (${yr})`,
      precedentSelectionReason: `Governing law and confidentiality provisions consistent with ${geography} market practice.`,
      draftingCommentary: {
        whyExists: "Establishes confidentiality obligations for the pre-signing period and clearly delineates binding from non-binding provisions.",
        riskProtected: "Prevents competitive harm from disclosure. Clear binding/non-binding delineation prevents either party claiming the entire LOI is enforceable.",
        marketComparison: "Partial-binding LOI structure with expressly identified binding provisions is universal market practice across all geographies and deal sizes.",
      },
      relevanceScore: 94,
    },
  ];

  // ── SPA ────────────────────────────────────────────────────────────────────
  const spaSections: GeneratedSection[] = [
    {
      id: "s1",
      title: "1. Definitions",
      clauseText: `As used in this Share Purchase Agreement ("Agreement"), the following terms shall have the meanings ascribed to them below:\n\n"Acquired Shares" means all of the issued and outstanding shares of capital stock of ${counterparty} (the "Company").\n"Closing" means the consummation of the purchase and sale of the Acquired Shares as contemplated by this Agreement.\n"Closing Date" means the date on which the Closing occurs.\n"Material Adverse Effect" means any event, circumstance, change, or effect that, individually or in the aggregate, has had or would reasonably be expected to have a material adverse effect on the business, financial condition, assets, liabilities, or results of operations of the Company, taken as a whole, other than any effect resulting from (i) general economic, financial market, or geopolitical conditions; (ii) conditions affecting the ${industry} industry generally; (iii) changes in applicable law or GAAP; or (iv) any action taken at Buyer's written request.\n"Transaction Documents" means this Agreement and all other agreements, instruments, and certificates to be delivered at Closing.`,
      riskIndicator: "KEEP",
      precedentSource: `Project Meridian (${yr - 1})`,
      precedentSelectionReason: `Definitions section drawn from a comparable ${industry} SPA with a robust MAC carve-out structure appropriate for ${geography}.`,
      draftingCommentary: {
        whyExists: "Establishes the defined terms that govern interpretation of the entire Agreement, reducing ambiguity and litigation risk.",
        riskProtected: "The MAC definition's carve-outs protect Seller from Buyer attempting to walk away based on industry-wide or macroeconomic factors beyond Target's control.",
        marketComparison: `MAC carve-outs for industry conditions, macro factors, and legal/GAAP changes are universal in ${geography} SPAs. The carve-out scope is consistent with current market practice at the ${dealSize} level.`,
      },
      relevanceScore: 91,
    },
    {
      id: "s2",
      title: "2. Purchase & Sale",
      clauseText: `Subject to the terms and conditions of this Agreement, at the Closing, Seller shall sell, assign, transfer, and deliver to Buyer, and Buyer shall purchase and acquire from Seller, all right, title, and interest in and to the Acquired Shares, free and clear of all Liens, in exchange for payment of the Purchase Price.\n\nAt the Closing: (i) Seller shall deliver to Buyer share certificates (or evidence of uncertificated shares) representing the Acquired Shares, duly endorsed in blank or accompanied by duly executed stock powers; (ii) the parties shall execute and deliver all other Transaction Documents; and (iii) Buyer shall pay the Closing Date Payment to Seller by wire transfer of immediately available funds to the account designated by Seller.`,
      riskIndicator: "KEEP",
      precedentSource: `Project Atlas (${yr - 2})`,
      precedentSelectionReason: `Clean transfer mechanics consistent with ${geography} practice for a ${dealSize} equity acquisition.`,
      draftingCommentary: {
        whyExists: "Establishes the core obligation of the parties — the sale and transfer of shares in exchange for the Purchase Price.",
        riskProtected: "Free-and-clear delivery obligation protects Buyer from acquiring encumbered shares. Simultaneous exchange mechanics protect both parties.",
        marketComparison: "Simultaneous at-Closing exchange of shares and consideration is the market standard for fully negotiated bilateral SPA transactions.",
      },
      relevanceScore: 95,
    },
    {
      id: "s3",
      title: "3. Purchase Price & Adjustment",
      clauseText: `The aggregate Purchase Price shall be an amount equal to: (i) the Base Purchase Price; minus (ii) the amount by which Closing Indebtedness exceeds zero; minus (iii) the amount by which Transaction Expenses exceed zero; plus (iv) the amount by which Closing Cash exceeds zero; plus or minus (v) the Net Working Capital Adjustment Amount.\n\nThe Net Working Capital Adjustment shall be calculated as the difference between Closing Net Working Capital and the Net Working Capital Target. Within ninety (90) days after the Closing Date, Buyer shall prepare and deliver to Seller a Closing Statement setting forth Buyer's calculation of each adjustment component. Seller shall have forty-five (45) days to review and dispute the Closing Statement. Undisputed amounts shall be paid promptly; disputed amounts shall be submitted to an independent accounting firm for final determination, whose decision shall be final and binding.`,
      riskIndicator: "REVIEW",
      precedentSource: `Project Meridian (${yr - 1})`,
      precedentSelectionReason: `Adjustment mechanism with post-Closing true-up and independent expert dispute resolution is consistent with precedent for ${dealSize} transactions.`,
      draftingCommentary: {
        whyExists: "Ensures the final Purchase Price reflects the actual financial condition of the business at Closing, not at signing.",
        riskProtected: "Protects Buyer from pre-Closing cash extraction or debt loading. Protects Seller from Buyer's opportunistic post-Closing claims through defined dispute resolution.",
        marketComparison: `Locked-box or completion accounts mechanism. Completion accounts with independent expert resolution is standard in ${geography} for transactions at the ${dealSize} level.`,
      },
      relevanceScore: 87,
    },
    {
      id: "s4",
      title: "4. Representations & Warranties (Seller)",
      clauseText: `Seller and the Company, jointly and severally, represent and warrant to Buyer as of the date hereof and as of the Closing Date that:\n\n(a) Organization. The Company is duly organized, validly existing, and in good standing under the laws of its jurisdiction of incorporation, and has full corporate power and authority to conduct its business as currently conducted.\n\n(b) Authorization. Seller has full legal capacity and authority to execute, deliver, and perform its obligations under this Agreement. This Agreement constitutes the valid and binding obligation of Seller, enforceable against Seller in accordance with its terms.\n\n(c) Capitalization. The Acquired Shares represent all issued and outstanding equity interests of the Company. There are no outstanding options, warrants, convertible securities, or other rights to acquire equity interests in the Company.\n\n(d) No Conflicts. The execution, delivery, and performance of this Agreement do not conflict with or violate (i) the organizational documents of the Company; (ii) any applicable law; or (iii) any material contract to which the Company is a party.\n\n(e) Financial Statements. The Financial Statements fairly present, in all material respects, the financial condition and results of operations of the Company as of the dates and for the periods indicated, prepared in accordance with GAAP consistently applied.`,
      riskIndicator: "HIGH ATTENTION",
      precedentSource: `Project Titan (${yr - 1})`,
      precedentSelectionReason: `Seller R&W package calibrated for a ${industry} acquisition in ${geography}, with standard carve-outs and materiality qualifiers.`,
      draftingCommentary: {
        whyExists: "Provides Buyer with contractual assurances about the state of the business and creates the basis for indemnification claims if representations prove false.",
        riskProtected: "Protects Buyer against hidden liabilities, undisclosed encumbrances, and misrepresentations. Material qualifiers and disclosure schedules protect Seller.",
        marketComparison: `R&W scope is consistent with current market practice for ${dealSize} ${industry} acquisitions. Parties typically negotiate a Representation & Warranty Insurance policy to backstop the indemnity.`,
      },
      relevanceScore: 82,
    },
    {
      id: "s5",
      title: "5. Indemnification Obligations",
      clauseText: `Seller shall indemnify, defend, and hold harmless Buyer and its affiliates from and against any Losses arising from: (i) any breach of any representation or warranty made by Seller; (ii) any breach of any covenant of Seller; and (iii) any pre-Closing tax liabilities of the Company to the extent not reflected in the Closing Statement.\n\nSeller's indemnification obligations shall be subject to: (i) a Deductible equal to [1.0%] of the Purchase Price, below which no claims shall be payable; (ii) an aggregate cap on liability equal to [15%] of the Purchase Price for breaches of general representations, and [100%] for breaches of Fundamental Representations; and (iii) a survival period of [18] months for general representations, and [5 years] for Fundamental Representations and pre-Closing tax matters.\n\nBuyer shall first seek recovery under any applicable Representation & Warranty Insurance policy before pursuing indemnification claims against Seller for general representation breaches.`,
      riskIndicator: "HIGH ATTENTION",
      precedentSource: `Project Falcon (${yr})`,
      precedentSelectionReason: `Indemnification structure with tiered caps and RWI-first requirement consistent with market practice for ${dealSize} strategic acquisitions.`,
      draftingCommentary: {
        whyExists: "Allocates post-Closing risk between Buyer and Seller and establishes the remedial framework for breach of the Agreement.",
        riskProtected: "Deductible protects Seller from trivial claims. Cap limits Seller's downside exposure. RWI-first obligation gives Seller clean exit where possible.",
        marketComparison: `15% general cap and 18-month survival are consistent with ${geography} market norms at the ${dealSize} level. RWI-first obligation is increasingly standard where R&W Insurance is obtained.`,
      },
      relevanceScore: 84,
    },
  ];

  // ── Due Diligence ─────────────────────────────────────────────────────────
  const ddSections: GeneratedSection[] = [
    {
      id: "s1",
      title: "1. Corporate & Organizational Matters",
      clauseText: `Please provide the following corporate and organizational documentation for the Company and each of its subsidiaries:\n\n1.1 Certificate of incorporation, articles of association, bylaws, and all amendments thereto.\n1.2 Register of shareholders, including details of all issued and outstanding equity interests, options, warrants, and convertible securities.\n1.3 Minutes of all meetings of the board of directors and shareholders for the past [3] years, including all written resolutions.\n1.4 Organizational chart showing the corporate structure of the Company and all subsidiaries.\n1.5 Details of all jurisdictions in which the Company is qualified to do business.\n1.6 All shareholder agreements, voting agreements, registration rights agreements, or similar documents.\n1.7 List of all current directors and officers, including date of appointment and compensation arrangements.`,
      riskIndicator: "KEEP",
      precedentSource: `Project Orion DD List (${yr - 1})`,
      precedentSelectionReason: `Standard corporate documentation request consistent with ${geography} diligence practice for ${industry} targets.`,
      draftingCommentary: {
        whyExists: "Establishes the legal existence, ownership structure, and governance of the Target — foundational for confirming Seller's authority to consummate the Transaction.",
        riskProtected: "Identifies unauthorized share issuances, conflicting shareholder rights, or governance defects that could impair Buyer's title to the Acquired Shares.",
        marketComparison: `3-year look-back on board minutes is standard. Cap table verification is critical at the ${dealSize} level where minority interests or option overhang may affect pricing.`,
      },
      relevanceScore: 96,
    },
    {
      id: "s2",
      title: "2. Financial Information & Audits",
      clauseText: `2.1 Audited financial statements (balance sheet, income statement, cash flow statement, notes) for the past [3] fiscal years, together with the independent auditor's reports.\n2.2 Management accounts and unaudited financial statements for all interim periods up to and including the most recently completed month.\n2.3 Details of all off-balance-sheet arrangements, contingent liabilities, and commitments.\n2.4 Schedule of all indebtedness (bank loans, bonds, capital leases, related-party loans) as of the most recent month-end.\n2.5 Monthly cash flow forecasts and management projections for the next [2] fiscal years, together with the key assumptions underlying such projections.\n2.6 Working capital analysis, including historical seasonality patterns and any unusual items.\n2.7 Details of any material accounting policy changes over the past 3 years.`,
      riskIndicator: "HIGH ATTENTION",
      precedentSource: `Project Titan DD List (${yr - 1})`,
      precedentSelectionReason: `Financial diligence scope calibrated for a ${dealSize} ${industry} target with a 3-year historical look-back and forward-looking projections review.`,
      draftingCommentary: {
        whyExists: "Financial diligence is the cornerstone of valuation confirmation and identification of hidden liabilities.",
        riskProtected: "Identifies GAAP compliance issues, undisclosed liabilities, aggressive revenue recognition, or deteriorating financial trends that affect Purchase Price.",
        marketComparison: `3-year audited financials plus interim management accounts is universal at the ${dealSize} level. Management projections review is critical to validating the business case.`,
      },
      relevanceScore: 98,
    },
    {
      id: "s3",
      title: "3. Material Contracts & Commitments",
      clauseText: `3.1 All customer contracts with annual revenue in excess of $[X], together with a summary of the top [20] customers by revenue for each of the past 2 years.\n3.2 All supplier and vendor contracts with annual spend in excess of $[X].\n3.3 All joint venture, partnership, and strategic alliance agreements.\n3.4 All exclusivity, non-compete, or most-favored-nation arrangements.\n3.5 All contracts containing change-of-control provisions, consent requirements, or termination rights triggered by the Transaction.\n3.6 All government and public sector contracts, including details of any regulatory approvals required for assignment.\n3.7 All contracts currently in material dispute or subject to threatened termination.\n3.8 Details of any contracts requiring consent for assignment in connection with the Transaction.`,
      riskIndicator: "HIGH ATTENTION",
      precedentSource: `Project Falcon DD List (${yr})`,
      precedentSelectionReason: `Contract review scope designed to identify change-of-control triggers and key commercial relationships critical to ${industry} business continuity.`,
      draftingCommentary: {
        whyExists: "Material contracts represent the commercial foundation of the business. Change-of-control provisions can create significant deal execution risk.",
        riskProtected: "Identifies contracts that may terminate or require consent upon Closing, protecting Buyer from post-Closing loss of key commercial relationships.",
        marketComparison: `Change-of-control review is universally required. Revenue concentration analysis is particularly critical for ${industry} businesses at the ${dealSize} level.`,
      },
      relevanceScore: 94,
    },
    {
      id: "s4",
      title: "4. Intellectual Property",
      clauseText: `4.1 Schedule of all registered intellectual property (patents, trademarks, copyrights, domain names) owned by the Company, including registration numbers, jurisdictions, and renewal dates.\n4.2 Schedule of all intellectual property licensed by the Company (inbound and outbound), including copies of all license agreements.\n4.3 Details of any open-source software incorporated into the Company's products or services, including the applicable open-source licenses.\n4.4 Copies of all IP assignment agreements executed by current and former employees, contractors, and consultants.\n4.5 Details of any IP disputes, claims, or threatened infringement actions.\n4.6 Details of any trade secrets and the measures taken to maintain their confidentiality.\n4.7 Source code escrow arrangements, if any.`,
      riskIndicator: "REVIEW",
      precedentSource: `Project Meridian DD List (${yr - 1})`,
      precedentSelectionReason: `IP diligence scope appropriate for a ${industry} business where intellectual property constitutes a core value driver.`,
      draftingCommentary: {
        whyExists: "In ${industry} transactions, IP ownership and freedom to operate are critical value drivers requiring thorough diligence.",
        riskProtected: "Identifies ownership gaps in employee/contractor IP assignments, open-source license compliance issues, and third-party infringement risks.",
        marketComparison: `IP diligence depth varies by industry. For ${industry} targets, this scope is standard and often extended further based on preliminary findings.`,
      },
      relevanceScore: 91,
    },
    {
      id: "s5",
      title: "5. Employment & Labor",
      clauseText: `5.1 List of all employees, including position, location, compensation (salary, bonus, equity), start date, and employment type (full-time, part-time, contractor).\n5.2 Copies of all employment agreements, offer letters, and severance agreements for senior employees.\n5.3 Details of all equity incentive plans, outstanding options, and vesting schedules.\n5.4 Details of any collective bargaining agreements or works council arrangements.\n5.5 Details of any pending or threatened employment-related claims, disputes, or regulatory investigations.\n5.6 Employee benefits and pension plan documentation, including details of any defined benefit obligations.\n5.7 Details of any key employee retention risks and any post-closing retention arrangements contemplated.`,
      riskIndicator: "REVIEW",
      precedentSource: `Project Atlas DD List (${yr - 2})`,
      precedentSelectionReason: `Employment diligence scope calibrated for a ${geography} ${industry} transaction, including equity overhang and retention risk analysis.`,
      draftingCommentary: {
        whyExists: "Human capital is a key value driver in ${industry} businesses. Employment liabilities and retention risks are material to post-Closing value realization.",
        riskProtected: "Identifies equity overhang affecting deal economics, wrongful dismissal exposure, and key person retention risks.",
        marketComparison: `Comprehensive employment diligence including equity plan analysis is standard at the ${dealSize} level, particularly for ${industry} businesses with significant human capital value.`,
      },
      relevanceScore: 89,
    },
    {
      id: "s6",
      title: "6. Litigation & Regulatory Compliance",
      clauseText: `6.1 Details of all pending, threatened, or settled litigation, arbitration, regulatory proceedings, or governmental investigations involving the Company within the past [5] years.\n6.2 Details of all regulatory licenses, permits, and approvals held by the Company, including expiry dates and any conditions attached.\n6.3 Details of any product recalls, regulatory sanctions, or compliance failures within the past [3] years.\n6.4 Anti-bribery and anti-corruption compliance program documentation and any internal or regulatory investigations.\n6.5 Data privacy and cybersecurity compliance documentation, including details of any data breaches within the past [3] years.\n6.6 Details of any material compliance issues identified in internal audits or external reviews.\n6.7 Competition / antitrust compliance documentation, including any merger control filings related to prior acquisitions.`,
      riskIndicator: "HIGH ATTENTION",
      precedentSource: `Project Falcon DD List (${yr})`,
      precedentSelectionReason: "Litigation and regulatory compliance scope includes data privacy and ABAC focus areas of heightened relevance for cross-border transactions.",
      draftingCommentary: {
        whyExists: "Regulatory and litigation exposure can represent material contingent liabilities not reflected on the balance sheet.",
        riskProtected: "Identifies regulatory risks that could delay or prevent Closing and post-Closing liabilities that affect Purchase Price.",
        marketComparison: `ABAC and data privacy diligence are now standard for all ${geography} transactions above ${dealSize}. Regulatory permit review is critical for ${industry} businesses.`,
      },
      relevanceScore: 92,
    },
    {
      id: "s7",
      title: "7. Tax Matters",
      clauseText: `7.1 Federal, state/provincial, and local tax returns for the past [5] years.\n7.2 Details of any pending or threatened tax audits, assessments, or disputes.\n7.3 Details of any tax elections, consents, or rulings that are material to the Company's tax position.\n7.4 Transfer pricing documentation and details of all intercompany transactions and arrangements.\n7.5 Details of all tax sharing, tax allocation, or tax indemnification agreements.\n7.6 Details of any net operating losses, tax credits, or other tax attributes, including any limitations on their use.\n7.7 Details of any material tax planning arrangements or structures that may be challenged by tax authorities.\n7.8 Details of any withholding tax obligations on cross-border payments.`,
      riskIndicator: "HIGH ATTENTION",
      precedentSource: `Project Titan DD List (${yr - 1})`,
      precedentSelectionReason: "Comprehensive tax diligence scope including transfer pricing and cross-border withholding relevant to the deal's geographic profile.",
      draftingCommentary: {
        whyExists: "Tax liabilities represent a material category of contingent risk that directly affects Purchase Price and post-Closing value.",
        riskProtected: "Identifies tax audit exposure, transfer pricing risks, and limitations on tax attributes that could adversely affect post-Closing tax efficiency.",
        marketComparison: `5-year tax return look-back is standard. Transfer pricing diligence is particularly important for ${geography} targets with cross-border operations.`,
      },
      relevanceScore: 93,
    },
    {
      id: "s8",
      title: "8. Insurance Policies",
      clauseText: `8.1 Copies of all current insurance policies, including coverage type, limits, deductibles, and expiry dates (D&O, E&O, general liability, property, cyber, employment practices, product liability, workers' compensation).\n8.2 Loss runs for the past [3] years.\n8.3 Details of any material claims made under existing policies within the past [3] years.\n8.4 Details of any coverage gaps, exclusions, or policies that are likely to require renewal or replacement following the Transaction.\n8.5 Details of any self-insurance arrangements or captive insurance structures.\n8.6 Details of any policies that will be cancelled or require replacement as a result of change of control.`,
      riskIndicator: "REVIEW",
      precedentSource: `Project Orion DD List (${yr - 1})`,
      precedentSelectionReason: "Insurance scope includes cyber coverage and change-of-control analysis consistent with current market practice.",
      draftingCommentary: {
        whyExists: "Insurance adequacy review confirms the business is appropriately protected against key operational and liability risks.",
        riskProtected: "Identifies coverage gaps that create post-Closing Buyer exposure and change-of-control cancellation risk.",
        marketComparison: `Cyber insurance review is now standard in all ${industry} diligence. Run-off coverage analysis is critical for D&O policies in connection with the Transaction.`,
      },
      relevanceScore: 85,
    },
  ];

  const sectionsByType: Record<string, GeneratedSection[]> = {
    LOI: loiSections,
    SPA: spaSections,
    "Due Diligence Request List": ddSections,
  };

  const sections = sectionsByType[documentType] ?? loiSections;

  return {
    documentType,
    sections,
    executiveSummary: {
      precedentStrategy: `The primary precedent selected for this ${documentType} is drawn from the firm's historical ${industry} deal library for ${geography} transactions in the ${dealSize} range. The precedent was selected based on deal size alignment, sector overlap, and comparable counterparty risk profile. Where no exact match existed, provisions were synthesized from the two closest precedents.`,
      draftingStrategy: `This ${documentType} is drafted from a ${documentType === "LOI" ? "Buyer" : "balanced"}-favorable starting position consistent with institutional M&A practice. All provisions are calibrated for the ${dealSize} deal size and ${geography} legal market. Materiality thresholds, cap structures, and survival periods reflect current market norms as of ${yr}.`,
      keyNegotiationConsiderations: `(1) Purchase Price adjustment mechanism — working capital peg definition and target setting will be a key negotiation point. (2) Indemnification cap and deductible — Seller will push to reduce the cap; market is ${dealSize === "Over $1B" ? "10-15%" : "15-20%"} for this deal size. (3) MAC definition carve-outs — scope of industry and macro carve-outs will determine Buyer's ability to walk in adverse conditions. (4) Representation & Warranty Insurance — parties should align on RWI policy terms early to structure the indemnity regime efficiently. (5) Exclusivity period — Seller will resist a long exclusivity period without meaningful buyer milestones.`,
    },
    alternativePrecedents: [
      {
        dealCodename: `Project Nexus (${yr - 2})`,
        similarityRationale: `${industry} sector acquisition in a comparable geography with similar target revenue profile.`,
        whyNotSelected: `Deal structure involved a stock-for-stock component inconsistent with the all-cash consideration contemplated here. Working capital mechanics were also sector-specific and not directly applicable.`,
      },
      {
        dealCodename: `Project Aurora (${yr - 1})`,
        similarityRationale: `Similar deal size and ${geography} jurisdiction, with comparable regulatory approval timeline.`,
        whyNotSelected: `Target operated under a different regulatory regime requiring specialized provisions. The primary precedent's provisions were more directly applicable to ${counterparty}'s business.`,
      },
    ],
    keyRisksForPartnerReview: [
      `Change-of-control provisions in material contracts — confirm all key customer and supplier consents are obtainable before Closing.`,
      `Purchase Price adjustment mechanism — working capital peg definition should be stress-tested against historical seasonality patterns.`,
      `Regulatory approval timeline — assess whether antitrust filing is required and expected clearance timeline could affect deal certainty.`,
      `Representation & Warranty Insurance — confirm insurability of key representations and align policy retention with indemnification deductible.`,
      `Key employee retention — identify critical personnel and negotiate appropriate retention arrangements prior to Closing announcement.`,
    ],
  };
}

// ─── Main API call with precedent context + 15s timeout fallback ──────────────

export async function generateDocument(
  deal: Record<string, unknown>,
  documentType: string
): Promise<GeneratedDocument> {
  // 1. Fetch precedent context from Supabase Storage (non-blocking if it fails)
  const precedentContext = await getPrecedentContext().catch(() => "");

  // 2. Race the AI call against a 15-second timeout
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("GENERATION_TIMEOUT")), 15000)
  );

  const fetchPromise = fetch(`${API_BASE}/api/generate-document`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deal, documentType, precedentContext }),
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error ?? `Server error ${res.status}`);
    }
    return res.json() as Promise<GeneratedDocument>;
  });

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    if (err instanceof Error && err.message === "GENERATION_TIMEOUT") {
      // Last resort: return plausible fallback document
      return generateFallbackDocument(deal, documentType);
    }
    throw err;
  }
}

// ─── New Deal Analysis ────────────────────────────────────────────────────────

export interface NewDealAnalysis {
  dealCodename: string;
  industry: string;
  contractType: string;
  geography: string;
  estimatedDealSize: string;
  counterpartyName: string;
  dealSummary: string;
}

export async function analyzeNewDeal(documentText: string): Promise<NewDealAnalysis> {
  const res = await fetch(`${API_BASE}/api/analyze-new-deal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentText }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `Server error ${res.status}`);
  }

  return res.json();
}

export interface AnalyzedClause {
  id: string;
  title: string;
  originalText: string;
  relevanceScore: number;
  status: "keep" | "review" | "outdated";
  flagReason: string | null;
  suggestedAction: string;
  category: string;
}

export interface AnalyzeResponse {
  dealContext: string;
  clauses: AnalyzedClause[];
  summary: string;
  keyRisks: string[];
}

export async function analyzeDocument(
  documentText: string,
  dealContext?: string
): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentText, dealContext }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `Server error ${res.status}`);
  }

  return res.json();
}
