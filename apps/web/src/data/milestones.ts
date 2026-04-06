export interface Milestone {
  id: string;
  category: MilestoneCategory;
  ageMonths: number;
  title: string;
  description: string;
  source: string;
}

export type MilestoneCategory = 'Motor' | 'Language' | 'Cognitive' | 'Social';

/**
 * Developmental milestones based on CDC/AAP guidelines.
 * Source: CDC "Learn the Signs. Act Early." program
 * https://www.cdc.gov/ncbddd/actearly/milestones/
 */
export const MILESTONES: Milestone[] = [
  // 2 months
  { id: 'm2-1', category: 'Motor', ageMonths: 2, title: 'Holds head up during tummy time', description: 'Can lift head and chest when lying on stomach.', source: 'CDC Milestone Checklist' },
  { id: 'm2-2', category: 'Motor', ageMonths: 2, title: 'Makes smoother movements with arms and legs', description: 'Movements become less jerky and more controlled.', source: 'CDC Milestone Checklist' },
  { id: 'm2-3', category: 'Language', ageMonths: 2, title: 'Coos and makes gurgling sounds', description: 'Begins making vowel sounds like "aah" and "ooh."', source: 'CDC Milestone Checklist' },
  { id: 'm2-4', category: 'Social', ageMonths: 2, title: 'Smiles at people', description: 'First social smile, usually in response to a parent\'s face or voice.', source: 'CDC Milestone Checklist' },
  { id: 'm2-5', category: 'Cognitive', ageMonths: 2, title: 'Follows things with eyes', description: 'Can track a moving object or person with their eyes.', source: 'CDC Milestone Checklist' },

  // 4 months
  { id: 'm4-1', category: 'Motor', ageMonths: 4, title: 'Holds head steady without support', description: 'Head control is well established when held upright.', source: 'CDC Milestone Checklist' },
  { id: 'm4-2', category: 'Motor', ageMonths: 4, title: 'Pushes down on legs when feet on hard surface', description: 'Bears some weight on legs when held in a standing position.', source: 'CDC Milestone Checklist' },
  { id: 'm4-3', category: 'Motor', ageMonths: 4, title: 'Brings hands to mouth', description: 'Reaches for and grasps objects, brings them to mouth to explore.', source: 'CDC Milestone Checklist' },
  { id: 'm4-4', category: 'Language', ageMonths: 4, title: 'Babbles with expression', description: 'Makes sounds that mimic speech patterns and tone.', source: 'CDC Milestone Checklist' },
  { id: 'm4-5', category: 'Social', ageMonths: 4, title: 'Likes to play with people', description: 'Enjoys social interaction and may cry when playing stops.', source: 'CDC Milestone Checklist' },
  { id: 'm4-6', category: 'Cognitive', ageMonths: 4, title: 'Reaches for toy with one hand', description: 'Shows hand-eye coordination by reaching for objects of interest.', source: 'CDC Milestone Checklist' },

  // 6 months
  { id: 'm6-1', category: 'Motor', ageMonths: 6, title: 'Rolls over in both directions', description: 'Can roll from front to back and back to front.', source: 'CDC Milestone Checklist' },
  { id: 'm6-2', category: 'Motor', ageMonths: 6, title: 'Begins to sit without support', description: 'Can sit briefly when placed in a sitting position.', source: 'CDC Milestone Checklist' },
  { id: 'm6-3', category: 'Motor', ageMonths: 6, title: 'Rocks back and forth on hands and knees', description: 'Getting ready to crawl by rocking in crawling position.', source: 'CDC Milestone Checklist' },
  { id: 'm6-4', category: 'Language', ageMonths: 6, title: 'Responds to own name', description: 'Turns head or looks when their name is called.', source: 'CDC Milestone Checklist' },
  { id: 'm6-5', category: 'Language', ageMonths: 6, title: 'Strings vowels together when babbling', description: 'Makes sounds like "ah," "eh," "oh" in longer strings.', source: 'CDC Milestone Checklist' },
  { id: 'm6-6', category: 'Social', ageMonths: 6, title: 'Knows familiar faces', description: 'Recognizes caregivers and begins to show stranger anxiety.', source: 'CDC Milestone Checklist' },
  { id: 'm6-7', category: 'Cognitive', ageMonths: 6, title: 'Brings things to mouth', description: 'Explores objects by putting them in mouth.', source: 'CDC Milestone Checklist' },

  // 9 months
  { id: 'm9-1', category: 'Motor', ageMonths: 9, title: 'Stands holding on to something', description: 'Pulls up to a standing position using furniture for support.', source: 'CDC Milestone Checklist' },
  { id: 'm9-2', category: 'Motor', ageMonths: 9, title: 'Sits without support', description: 'Can sit independently for extended periods.', source: 'CDC Milestone Checklist' },
  { id: 'm9-3', category: 'Motor', ageMonths: 9, title: 'Crawls', description: 'Moves forward on hands and knees or scoots on bottom.', source: 'CDC Milestone Checklist' },
  { id: 'm9-4', category: 'Motor', ageMonths: 9, title: 'Uses pincer grasp', description: 'Picks up small objects between thumb and index finger.', source: 'CDC Milestone Checklist' },
  { id: 'm9-5', category: 'Language', ageMonths: 9, title: 'Understands "no"', description: 'Responds to the word "no" by pausing or stopping briefly.', source: 'CDC Milestone Checklist' },
  { id: 'm9-6', category: 'Language', ageMonths: 9, title: 'Makes different sounds like "mamamama" and "babababa"', description: 'Consonant-vowel babbling becomes more varied.', source: 'CDC Milestone Checklist' },
  { id: 'm9-7', category: 'Social', ageMonths: 9, title: 'Has favorite toys', description: 'Shows clear preferences for certain objects.', source: 'CDC Milestone Checklist' },
  { id: 'm9-8', category: 'Social', ageMonths: 9, title: 'May be clingy with familiar adults', description: 'Shows separation anxiety and prefers known caregivers.', source: 'CDC Milestone Checklist' },
  { id: 'm9-9', category: 'Cognitive', ageMonths: 9, title: 'Plays peek-a-boo', description: 'Enjoys and participates in simple interactive games.', source: 'CDC Milestone Checklist' },
  { id: 'm9-10', category: 'Cognitive', ageMonths: 9, title: 'Watches the path of something as it falls', description: 'Developing understanding of object permanence.', source: 'CDC Milestone Checklist' },

  // 12 months
  { id: 'm12-1', category: 'Motor', ageMonths: 12, title: 'Pulls up to stand and walks holding on to furniture', description: 'Cruises along furniture and may take first independent steps.', source: 'CDC Milestone Checklist' },
  { id: 'm12-2', category: 'Motor', ageMonths: 12, title: 'May take a few steps without holding on', description: 'Beginning to walk independently, though still unsteady.', source: 'CDC Milestone Checklist' },
  { id: 'm12-3', category: 'Motor', ageMonths: 12, title: 'Drinks from a cup without a lid', description: 'Can hold and drink from an open cup with assistance.', source: 'CDC Milestone Checklist' },
  { id: 'm12-4', category: 'Language', ageMonths: 12, title: 'Says "mama" and "dada" and at least one other word', description: 'Uses simple words with meaning to refer to specific people or objects.', source: 'CDC Milestone Checklist' },
  { id: 'm12-5', category: 'Language', ageMonths: 12, title: 'Responds to simple spoken requests', description: 'Understands simple instructions like "give me the ball."', source: 'CDC Milestone Checklist' },
  { id: 'm12-6', category: 'Social', ageMonths: 12, title: 'Plays games like pat-a-cake', description: 'Engages in simple interactive games with gestures.', source: 'CDC Milestone Checklist' },
  { id: 'm12-7', category: 'Cognitive', ageMonths: 12, title: 'Explores things by shaking, banging, throwing', description: 'Actively experiments with objects to see what happens.', source: 'CDC Milestone Checklist' },
  { id: 'm12-8', category: 'Cognitive', ageMonths: 12, title: 'Finds hidden things easily', description: 'Has developed object permanence — knows things exist when hidden.', source: 'CDC Milestone Checklist' },

  // 18 months
  { id: 'm18-1', category: 'Motor', ageMonths: 18, title: 'Walks independently', description: 'Walks on their own without holding on to anything.', source: 'CDC Milestone Checklist' },
  { id: 'm18-2', category: 'Motor', ageMonths: 18, title: 'Scribbles with crayon', description: 'Can hold a crayon and make marks on paper.', source: 'CDC Milestone Checklist' },
  { id: 'm18-3', category: 'Motor', ageMonths: 18, title: 'Eats with a spoon', description: 'Attempts to use a spoon for self-feeding, though messy.', source: 'CDC Milestone Checklist' },
  { id: 'm18-4', category: 'Language', ageMonths: 18, title: 'Says several single words', description: 'Vocabulary of around 10-20 words used meaningfully.', source: 'CDC Milestone Checklist' },
  { id: 'm18-5', category: 'Language', ageMonths: 18, title: 'Points to show things to others', description: 'Uses pointing to communicate interest or needs.', source: 'CDC Milestone Checklist' },
  { id: 'm18-6', category: 'Social', ageMonths: 18, title: 'May have temper tantrums', description: 'Expresses frustration through tantrums as emotions develop.', source: 'CDC Milestone Checklist' },
  { id: 'm18-7', category: 'Cognitive', ageMonths: 18, title: 'Knows what ordinary things are for', description: 'Understands the use of everyday objects like a phone or brush.', source: 'CDC Milestone Checklist' },

  // 24 months
  { id: 'm24-1', category: 'Motor', ageMonths: 24, title: 'Kicks a ball', description: 'Can kick a ball forward without losing balance.', source: 'CDC Milestone Checklist' },
  { id: 'm24-2', category: 'Motor', ageMonths: 24, title: 'Runs', description: 'Runs with increasing coordination and confidence.', source: 'CDC Milestone Checklist' },
  { id: 'm24-3', category: 'Motor', ageMonths: 24, title: 'Walks up stairs holding on', description: 'Can climb stairs with support, one step at a time.', source: 'CDC Milestone Checklist' },
  { id: 'm24-4', category: 'Language', ageMonths: 24, title: 'Says sentences with 2-4 words', description: 'Combines words into simple phrases like "more milk" or "daddy go."', source: 'CDC Milestone Checklist' },
  { id: 'm24-5', category: 'Language', ageMonths: 24, title: 'Points to things in a book when asked', description: 'Can identify pictures and objects when named.', source: 'CDC Milestone Checklist' },
  { id: 'm24-6', category: 'Social', ageMonths: 24, title: 'Plays alongside other children', description: 'Engages in parallel play — plays near but not yet with other children.', source: 'CDC Milestone Checklist' },
  { id: 'm24-7', category: 'Cognitive', ageMonths: 24, title: 'Sorts shapes and colors', description: 'Can match and sort objects by shape and color.', source: 'CDC Milestone Checklist' },
  { id: 'm24-8', category: 'Cognitive', ageMonths: 24, title: 'Follows two-step instructions', description: 'Can follow directions like "pick up the ball and bring it to me."', source: 'CDC Milestone Checklist' },
];

/** Get unique age checkpoints from the milestone data */
export function getMilestoneAges(): number[] {
  return [...new Set(MILESTONES.map((m) => m.ageMonths))].sort((a, b) => a - b);
}

/** Get milestones for a specific age */
export function getMilestonesByAge(ageMonths: number): Milestone[] {
  return MILESTONES.filter((m) => m.ageMonths === ageMonths);
}

/** Get milestones up to and including the child's current age */
export function getMilestonesForChild(childAgeMonths: number): { age: number; milestones: Milestone[] }[] {
  const ages = getMilestoneAges().filter((a) => a <= childAgeMonths + 3); // include next upcoming
  return ages.map((age) => ({
    age,
    milestones: getMilestonesByAge(age)
  }));
}
