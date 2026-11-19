/** Sample UMAT catalogue stubs — same programme set as Ace web. */

export type Programme = {
  id: string;
  name: string;
  short: string;
  code: string;
};

export type Course = {
  id: string;
  programmeId: string;
  code: string;
  title: string;
  level: string;
};

export type Resource = {
  id: string;
  courseId: string;
  title: string;
  type: 'slides' | 'notes' | 'past-questions' | 'tutorials' | 'videos';
  sizeLabel: string;
};

export const PROGRAMMES: Programme[] = [
  { id: 'electrical', name: 'Electrical Engineering', short: 'Electrical', code: 'EE' },
  { id: 'mechanical', name: 'Mechanical Engineering', short: 'Mechanical', code: 'ME' },
  { id: 'petroleum', name: 'Petroleum Engineering', short: 'Petroleum', code: 'PE' },
  { id: 'mining', name: 'Mining Engineering', short: 'Mining', code: 'MN' },
  { id: 'geology', name: 'Geology', short: 'Geology', code: 'GL' },
  { id: 'geomatics', name: 'Geomatics', short: 'Geomatics', code: 'GM' },
  { id: 'logistics', name: 'Logistics and Transport', short: 'Logistics', code: 'LT' },
  { id: 'computer-science', name: 'Computer Science', short: 'Computer Science', code: 'CS' },
  { id: 'data-science', name: 'Data Science', short: 'Data Science', code: 'DS' },
  { id: 'robotics-ai', name: 'Robotics and AI', short: 'Robotics & AI', code: 'RAI' },
  { id: 'cyber-security', name: 'Cyber Security', short: 'Cyber Security', code: 'CYB' },
  { id: 'information-systems', name: 'Information Systems', short: 'Info Systems', code: 'IS' },
  { id: 'environmental-safety', name: 'Environmental and Safety', short: 'Env & Safety', code: 'ES' },
  { id: 'land-administration', name: 'Land Administration', short: 'Land Admin', code: 'LA' },
  { id: 'telecommunication', name: 'Telecommunication', short: 'Telecom', code: 'TC' },
  { id: 'spatial-planning', name: 'Spatial Planning', short: 'Spatial Planning', code: 'SP' },
  { id: 'minerals', name: 'Minerals Engineering', short: 'Minerals', code: 'MI' },
];

export const COURSES: Course[] = [
  {
    id: 'ee-201',
    programmeId: 'electrical',
    code: 'EE 201',
    title: 'Circuit Theory',
    level: '200',
  },
  {
    id: 'ee-203',
    programmeId: 'electrical',
    code: 'EE 203',
    title: 'Digital Electronics',
    level: '200',
  },
  {
    id: 'me-101',
    programmeId: 'mechanical',
    code: 'ME 101',
    title: 'Engineering Drawing',
    level: '100',
  },
  {
    id: 'cs-101',
    programmeId: 'computer-science',
    code: 'CS 101',
    title: 'Introduction to Programming',
    level: '100',
  },
  {
    id: 'ds-201',
    programmeId: 'data-science',
    code: 'DS 201',
    title: 'Statistics for Data Science',
    level: '200',
  },
];

export const RESOURCES: Resource[] = [
  {
    id: 'res-ee201-slides',
    courseId: 'ee-201',
    title: 'Circuit Theory — Lecture Slides',
    type: 'slides',
    sizeLabel: '2.4 MB',
  },
  {
    id: 'res-ee201-pq',
    courseId: 'ee-201',
    title: 'Circuit Theory — Past Questions',
    type: 'past-questions',
    sizeLabel: '1.1 MB',
  },
  {
    id: 'res-ee203-notes',
    courseId: 'ee-203',
    title: 'Digital Electronics — Notes',
    type: 'notes',
    sizeLabel: '890 KB',
  },
  {
    id: 'res-me101-slides',
    courseId: 'me-101',
    title: 'Engineering Drawing — Slides',
    type: 'slides',
    sizeLabel: '3.2 MB',
  },
  {
    id: 'res-cs101-tut',
    courseId: 'cs-101',
    title: 'Intro Programming — Tutorials',
    type: 'tutorials',
    sizeLabel: '640 KB',
  },
  {
    id: 'res-ds201-notes',
    courseId: 'ds-201',
    title: 'Statistics — Lecture Notes',
    type: 'notes',
    sizeLabel: '1.5 MB',
  },
];

export function getProgramme(id: string) {
  return PROGRAMMES.find((p) => p.id === id);
}

export function getCoursesForProgramme(programmeId: string) {
  return COURSES.filter((c) => c.programmeId === programmeId);
}

export function getCourse(id: string) {
  return COURSES.find((c) => c.id === id);
}

export function getResourcesForCourse(courseId: string) {
  return RESOURCES.filter((r) => r.courseId === courseId);
}

export function getResource(id: string) {
  return RESOURCES.find((r) => r.id === id);
}

export const RESOURCE_TYPE_LABEL: Record<Resource['type'], string> = {
  slides: 'Course Slides',
  notes: 'Lecture Notes',
  'past-questions': 'Past Questions',
  tutorials: 'Tutorials',
  videos: 'Videos',
};
