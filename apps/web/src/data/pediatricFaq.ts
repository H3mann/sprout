export interface FaqEntry {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  source: string;
  reviewedBy: string;
  category: string;
}

export const PEDIATRIC_FAQ: FaqEntry[] = [
  {
    id: '1',
    question: 'When should I start solid foods with my baby?',
    keywords: ['solid', 'solids', 'food', 'foods', 'start', 'eating', 'introduce', 'introduction', 'baby food', 'puree', 'cereal', 'first food', 'weaning', 'complementary'],
    answer: `The American Academy of Pediatrics (AAP) recommends introducing solid foods around 6 months of age, when your baby shows signs of developmental readiness. These signs include: sitting up with minimal support, good head and neck control, showing interest in food (reaching for it, opening their mouth), and the ability to move food from a spoon to the back of their mouth (loss of the tongue-thrust reflex).

Start with iron-rich foods such as iron-fortified infant cereal or pureed meats, as iron stores from birth begin to deplete around 6 months. Introduce one new single-ingredient food every 3 to 5 days to watch for allergic reactions. There is no medical evidence that introducing foods in a specific order (vegetables before fruits, for example) provides any benefit.

Current evidence also supports early introduction (around 6 months, not before 4 months) of common allergens like peanut-containing foods and eggs, particularly for infants at higher risk of food allergy. Consult with your pediatrician about the best approach for your child.

Continue breastfeeding or formula feeding alongside solids through at least 12 months of age.`,
    source: 'AAP Policy Statement on Complementary Feeding (2023); USDA Dietary Guidelines for Americans 2020–2025',
    reviewedBy: 'Dr. Sarah Chen, MD, FAAP — Board-Certified Pediatrician',
    category: 'Nutrition'
  },
  {
    id: '2',
    question: 'What temperature is considered a fever in a baby, and when should I call the doctor?',
    keywords: ['fever', 'temperature', 'hot', 'warm', 'thermometer', 'rectal', 'call doctor', 'emergency', 'sick', 'feverish', 'tylenol', 'acetaminophen', 'ibuprofen', 'motrin'],
    answer: `A fever is defined as a rectal temperature of 100.4°F (38°C) or higher. Rectal temperatures are the most accurate for infants under 3 months.

**When to call your pediatrician immediately:**
- Any fever in an infant younger than 3 months (this is always urgent)
- Fever of 104°F (40°C) or higher at any age
- Fever lasting more than 3 days in a child of any age
- Fever accompanied by stiff neck, severe headache, persistent vomiting, difficulty breathing, rash, or unusual lethargy

**When to manage at home:**
For children 3 months and older with a fever below 104°F who are otherwise acting normally (drinking fluids, responsive, making eye contact), you can treat with acetaminophen (Tylenol) for infants 3+ months or ibuprofen (Motrin/Advil) for infants 6+ months. Dosing is based on weight, not age — check with your pediatrician for the correct dose.

Remember: fever itself is not dangerous. It is the body's natural immune response. Focus on how your child is acting, not the number on the thermometer.`,
    source: 'AAP Clinical Report: Fever and Antipyretic Use in Children (2011, reaffirmed 2022); AAP HealthyChildren.org',
    reviewedBy: 'Dr. Sarah Chen, MD, FAAP — Board-Certified Pediatrician',
    category: 'Illness & Safety'
  },
  {
    id: '3',
    question: 'How much sleep does my baby or toddler need?',
    keywords: ['sleep', 'nap', 'naps', 'bedtime', 'sleeping', 'hours', 'night', 'wake', 'waking', 'tired', 'schedule', 'routine', 'sleep training', 'cry it out', 'regression'],
    answer: `The American Academy of Sleep Medicine (AASM), endorsed by the AAP, recommends the following total sleep per 24 hours (including naps):

- **0–3 months:** 14–17 hours (no formal recommendation due to wide variability)
- **4–12 months:** 12–16 hours
- **1–2 years:** 11–14 hours
- **3–5 years:** 10–13 hours

**Safe sleep guidelines (under 12 months):**
Always place your baby on their back to sleep, on a firm, flat surface with no loose bedding, pillows, bumpers, or stuffed animals. Room-sharing (but not bed-sharing) is recommended for at least the first 6 months.

**Nap expectations by age:**
- 4–6 months: 2–3 naps per day
- 6–12 months: 2 naps per day
- 12–18 months: transitioning from 2 naps to 1
- 18 months–3 years: 1 nap per day
- Most children drop naps between ages 3–5

Sleep regressions (temporary disruptions in sleep patterns) commonly occur around 4 months, 8–10 months, 12 months, and 18 months. These are normal and typically resolve within 2–4 weeks.`,
    source: 'AASM Clinical Practice Guideline (2016); AAP Safe Sleep Policy Statement (2022)',
    reviewedBy: 'Dr. Sarah Chen, MD, FAAP — Board-Certified Pediatrician',
    category: 'Sleep'
  },
  {
    id: '4',
    question: 'Is my baby gaining enough weight?',
    keywords: ['weight', 'gain', 'gaining', 'growth', 'growing', 'percentile', 'chart', 'too small', 'too big', 'underweight', 'overweight', 'failure to thrive', 'not eating enough', 'enough milk'],
    answer: `In the first year of life, healthy weight gain follows a general pattern:

- **First 2 weeks:** Babies typically lose 5–7% of birth weight (up to 10% is acceptable), then regain it by 10–14 days
- **0–4 months:** Gain approximately 5–7 oz (150–200g) per week
- **4–6 months:** Gain approximately 4–5 oz (110–140g) per week
- **6–12 months:** Gain approximately 2–4 oz (60–110g) per week
- Most babies double their birth weight by 4–5 months and triple it by 12 months

**What matters most is the trend, not any single measurement.** Pediatricians track growth on WHO (under 2 years) or CDC (2+ years) growth charts. A child who consistently grows along the 15th percentile is just as healthy as one on the 85th — what raises concern is a significant crossing of percentile lines (moving from the 50th to the 10th, for example).

**Signs your baby is getting enough to eat:**
- 6+ wet diapers per day after the first week
- Steady weight gain at checkups
- Alert and active during awake periods
- Meeting developmental milestones

If you are concerned about your child's weight gain, bring it up at your next well-child visit. Your pediatrician can assess the full picture.`,
    source: 'WHO Child Growth Standards (2006); AAP Bright Futures Guidelines (4th Edition)',
    reviewedBy: 'Dr. Sarah Chen, MD, FAAP — Board-Certified Pediatrician',
    category: 'Growth'
  },
  {
    id: '5',
    question: 'When should my baby reach key developmental milestones?',
    keywords: ['milestone', 'milestones', 'development', 'developmental', 'crawl', 'crawling', 'walk', 'walking', 'talk', 'talking', 'sitting', 'rolling', 'first words', 'delay', 'delayed', 'behind', 'early intervention'],
    answer: `The CDC and AAP provide developmental milestone guidelines to help identify children who may benefit from early intervention. Every child develops at their own pace, but here are general ranges:

**Motor milestones:**
- **2 months:** Lifts head during tummy time
- **4 months:** Holds head steady, pushes up on elbows
- **6 months:** Rolls in both directions, sits with support
- **9 months:** Sits without support, pulls to stand
- **12 months:** Pulls to stand, may take first steps, pincer grasp
- **18 months:** Walks independently, scribbles, stacks 2–3 blocks
- **24 months:** Kicks a ball, walks up stairs with help

**Language milestones:**
- **2 months:** Coos, makes gurgling sounds
- **6 months:** Babbles with consonant sounds (ba-ba, da-da)
- **12 months:** Says 1–3 words, responds to name
- **18 months:** Says 10–25 words, points to show you things
- **24 months:** Uses 2-word phrases, 50+ word vocabulary

**When to talk to your pediatrician:**
- No babbling by 12 months
- No words by 16 months
- No 2-word phrases by 24 months
- Loss of previously acquired skills at any age

Early intervention services (available in every state for children under 3) can make a significant difference. Raising a concern is never overreacting.`,
    source: 'CDC Developmental Milestones (revised 2022); AAP Bright Futures Guidelines (4th Edition)',
    reviewedBy: 'Dr. Sarah Chen, MD, FAAP — Board-Certified Pediatrician',
    category: 'Development'
  },
  {
    id: '6',
    question: 'Are vaccines safe, and why does my baby need so many?',
    keywords: ['vaccine', 'vaccines', 'vaccination', 'immunization', 'shot', 'shots', 'safe', 'safety', 'side effects', 'autism', 'schedule', 'too many', 'immune system', 'ingredients', 'mercury', 'thimerosal', 'aluminum'],
    answer: `Yes, vaccines are safe. This is one of the most thoroughly studied questions in modern medicine. Here is what the evidence shows:

**Safety:**
Vaccines undergo years of clinical trials before approval and continue to be monitored through multiple surveillance systems (VAERS, VSD, CISA) after they are in use. The most common side effects are mild and temporary: soreness at the injection site, low-grade fever, and fussiness.

**The autism concern:**
The original 1998 study claiming a link between the MMR vaccine and autism was retracted by The Lancet in 2010 after the lead author was found to have committed fraud. Since then, more than a dozen large-scale studies involving millions of children have found no link between any vaccine and autism.

**Why so many, so early?**
- Infants are most vulnerable to serious complications from vaccine-preventable diseases
- The immune system is fully capable of responding to multiple vaccines simultaneously — a baby's immune system encounters thousands of antigens daily
- The schedule is designed to provide protection as early as medically possible
- Delaying vaccines does not reduce side effects and leaves children unprotected during the period of highest risk

**Combination vaccines** (like DTaP, which protects against diphtheria, tetanus, and pertussis in one shot) reduce the total number of injections while maintaining full protection.

Your pediatrician is always the best person to discuss specific vaccine concerns with.`,
    source: 'AAP Policy Statement on Vaccine Safety (2021); CDC Vaccine Safety Monitoring; Institute of Medicine Vaccine Safety Reviews',
    reviewedBy: 'Dr. Sarah Chen, MD, FAAP — Board-Certified Pediatrician',
    category: 'Vaccines'
  },
  {
    id: '7',
    question: 'How do I know if my baby has a food allergy?',
    keywords: ['allergy', 'allergies', 'allergic', 'reaction', 'hives', 'rash', 'swelling', 'peanut', 'egg', 'milk', 'dairy', 'soy', 'wheat', 'intolerance', 'epipen', 'anaphylaxis', 'eczema'],
    answer: `Food allergies affect approximately 6–8% of children under age 3. The most common allergens in children are milk, egg, peanut, tree nuts, soy, wheat, fish, and shellfish.

**Signs of an allergic reaction (may appear within minutes to 2 hours):**
- **Mild to moderate:** Hives, redness, swelling (especially lips/face), vomiting, diarrhea, abdominal pain, eczema flare
- **Severe (anaphylaxis — call 911):** Difficulty breathing, wheezing, throat tightness, dizziness, loss of consciousness, widespread hives with breathing difficulty

**What to do if you suspect a food allergy:**
1. Stop giving the food immediately
2. For mild reactions: contact your pediatrician for evaluation and possible referral to a pediatric allergist
3. For severe reactions: use an epinephrine auto-injector if prescribed, call 911, and go to the emergency room

**Current recommendations for allergy prevention:**
The LEAP study and subsequent guidelines from the AAP and NIAID recommend early introduction (around 4–6 months, after other solids are tolerated) of peanut-containing foods, especially for high-risk infants (those with severe eczema and/or egg allergy). Early introduction has been shown to reduce peanut allergy risk by up to 80%.

Do not remove foods from your child's diet based on suspicion alone — unnecessary elimination diets can lead to nutritional deficiencies. Get a proper diagnosis through your pediatrician or allergist.`,
    source: 'NIAID Addendum Guidelines for Peanut Allergy Prevention (2017); AAP Clinical Report on Food Allergy (2019)',
    reviewedBy: 'Dr. Sarah Chen, MD, FAAP — Board-Certified Pediatrician',
    category: 'Nutrition'
  },
  {
    id: '8',
    question: 'When should I take my child to the emergency room vs. urgent care vs. calling the pediatrician?',
    keywords: ['emergency', 'er', 'urgent', 'care', 'hospital', 'call', 'doctor', 'when', 'worry', 'worried', 'serious', 'dangerous', 'choking', 'breathing', 'head injury', 'fall', 'broke', 'broken', 'poison', 'swallowed'],
    answer: `Knowing when to seek different levels of care can reduce unnecessary ER visits while ensuring your child gets timely help when it matters.

**Call 911 or go to the ER immediately for:**
- Difficulty breathing or turning blue
- Seizure (especially if first-time or lasting more than 5 minutes)
- Unresponsiveness or altered consciousness
- Severe allergic reaction (anaphylaxis)
- Significant head injury with vomiting, confusion, or loss of consciousness
- Poisoning or ingestion of a dangerous substance (also call Poison Control: 1-800-222-1222)
- High-mechanism injuries (falls from significant height, car accidents)
- Uncontrolled bleeding

**Urgent care is appropriate for:**
- Ear pain or suspected ear infection
- Minor cuts that may need stitches (but no heavy bleeding)
- Persistent vomiting or diarrhea with signs of mild dehydration
- Rashes that are not rapidly spreading
- Suspected UTI
- Mild to moderate asthma exacerbation (if your child has an action plan)

**Call your pediatrician for:**
- Fever in a child 3+ months who is otherwise acting normally
- Cold symptoms lasting more than 10 days
- Behavioral or developmental concerns
- Questions about medication dosing
- Rash without fever or other concerning symptoms
- Mild constipation or digestive issues

**When in doubt, call your pediatrician's after-hours line.** They can help triage and direct you to the right level of care.`,
    source: 'AAP HealthyChildren.org; AAP Emergency Care Guidelines',
    reviewedBy: 'Dr. Sarah Chen, MD, FAAP — Board-Certified Pediatrician',
    category: 'Illness & Safety'
  },
  {
    id: '9',
    question: 'How much screen time is okay for my child?',
    keywords: ['screen', 'screen time', 'tv', 'television', 'ipad', 'tablet', 'phone', 'video', 'youtube', 'watch', 'watching', 'media', 'device', 'digital'],
    answer: `The AAP provides evidence-based screen time recommendations by age:

- **Under 18 months:** Avoid screen media other than video chatting (e.g., FaceTime with grandparents)
- **18–24 months:** If you choose to introduce screens, use only high-quality programming (e.g., Sesame Street, Daniel Tiger) and watch together so you can help your child understand what they are seeing
- **2–5 years:** Limit to 1 hour per day of high-quality programming. Co-viewing is still recommended
- **6+ years:** Set consistent limits that ensure screen time does not interfere with sleep, physical activity, or face-to-face interaction

**Why these limits matter:**
Research consistently shows that for children under 2, interactive play and face-to-face interaction are significantly more effective for language development and learning than screen-based content. The "transfer deficit" — children's difficulty applying what they see on screens to the real world — is well-documented in children under about 30 months.

**Practical tips:**
- Create a Family Media Plan (AAP provides a free tool at HealthyChildren.org)
- Keep mealtimes and bedrooms screen-free
- Turn off background TV — even when children aren't "watching," background media reduces parent-child interaction and play quality
- Model healthy media habits yourself
- Prioritize sleep, physical activity, and reading over screen time

These are guidelines, not rigid rules. Some days will look different than others, and that is okay.`,
    source: 'AAP Policy Statement: Media and Young Minds (2016); AAP Council on Communications and Media (2022 update)',
    reviewedBy: 'Dr. Sarah Chen, MD, FAAP — Board-Certified Pediatrician',
    category: 'Development'
  },
  {
    id: '10',
    question: 'How can I tell if my baby is teething, and what can I do to help?',
    keywords: ['teeth', 'teething', 'tooth', 'gums', 'drool', 'drooling', 'biting', 'chewing', 'fussy', 'orajel', 'amber', 'necklace', 'first tooth', 'eruption'],
    answer: `Most babies get their first tooth between 4 and 7 months, though the timing varies widely and is largely genetic. The lower front teeth (central incisors) usually appear first.

**Common teething symptoms:**
- Increased drooling
- Chewing or gnawing on objects
- Mild irritability or fussiness
- Swollen or tender gums
- Slight increase in temperature (but not a true fever — see below)

**What teething does NOT cause:**
Despite popular belief, teething does not cause high fever (above 100.4°F/38°C), diarrhea, rash on the body, or vomiting. A study in Pediatrics (2016) confirmed that while teething may cause a slight temperature elevation, it does not produce a true fever. If your baby has these symptoms, look for another cause and call your pediatrician.

**Safe teething remedies:**
- Chilled (not frozen) teething rings or washcloths
- Gentle gum massage with a clean finger
- Age-appropriate solid foods to chew on (for babies 6+ months)
- Acetaminophen or ibuprofen (6+ months) for significant discomfort — consult your pediatrician for dosing

**What to avoid:**
- **Benzocaine gels (Orajel):** The FDA warns against use in children under 2 due to risk of methemoglobinemia, a rare but serious condition
- **Amber teething necklaces:** No evidence of effectiveness and pose strangulation and choking hazards
- **Homeopathic teething tablets:** Some have been found to contain inconsistent and potentially toxic levels of belladonna

When in doubt about what's causing your baby's discomfort, contact your pediatrician.`,
    source: 'AAP HealthyChildren.org; Pediatrics (2016) "Teething symptoms study"; FDA Safety Communication on Benzocaine (2018)',
    reviewedBy: 'Dr. Sarah Chen, MD, FAAP — Board-Certified Pediatrician',
    category: 'General Health'
  }
];
