/**
 * CUT Academic Programs organized by School
 */

export interface AcademicProgram {
    name: string;
    duration: number; // in years
    options?: string[]; // For programs with specializations
}

export interface School {
    name: string;
    programs: AcademicProgram[];
}

export const CUT_SCHOOLS: School[] = [
    {
        name: 'School of Engineering Sciences and Technology',
        programs: [
            { name: 'Bachelor of Engineering (Hons) in Industrial Electronics', duration: 5 },
            { name: 'Bachelor of Engineering (Hons) in Production Engineering', duration: 5 },
            { name: 'Bachelor of Engineering (Hons) in Mechatronics Engineering', duration: 5 },
            { name: 'Bachelor of Engineering (Hons) in Computer Engineering', duration: 5 },
            { name: 'Bachelor of Science (Hons) in Environmental Engineering', duration: 5 },
            { name: 'Bachelor of Engineering (Hons) in Fuels and Energy', duration: 5 },
            { name: 'Bachelor of Science (Hons) in Information Technology', duration: 4 },
        ],
    },
    {
        name: 'School of Entrepreneurship and Business Sciences',
        programs: [
            { name: 'Bachelor of Science (Hons) in Accountancy', duration: 4 },
            { name: 'Bachelor of Science (Hons) in International Marketing', duration: 4 },
            { name: 'Bachelor of Science (Hons) in Retail and Operations Management', duration: 4 },
            { name: 'Bachelor of Science (Hons) in Entrepreneurship and Business Management', duration: 4 },
            {
                name: 'Bachelor of Science (Hons) in Supply Chain Management',
                duration: 4,
                options: ['Procurement', 'Logistics', 'Transport']
            },
            { name: 'Bachelor of Science (Hons) in Business Management and Entrepreneurship', duration: 4 },
        ],
    },
    {
        name: 'School of Agricultural Sciences and Technology',
        programs: [
            {
                name: 'Bachelor of Science (Hons) in Agricultural Engineering',
                duration: 5,
                options: ['Irrigation', 'Mechanisation']
            },
            { name: 'Bachelor of Science (Hons) in Animal Production and Technology', duration: 4 },
            { name: 'Bachelor of Science (Hons) in Animal Health Science and Technology', duration: 4 },
            {
                name: 'Bachelor of Science (Hons) in Crop Science and Technology',
                duration: 4,
                options: ['Agronomy', 'Horticulture', 'Plant Breeding']
            },
            { name: 'Bachelor of Science (Hons) in Food Science and Technology', duration: 4 },
        ],
    },
    {
        name: 'School of Natural Sciences and Mathematics',
        programs: [
            {
                name: 'Bachelor of Science (Hons) in Mathematics',
                duration: 4,
                options: ['Fluid Dynamics', 'Dynamical Systems', 'Operations Research', 'Actuarial Science', 'Scientific Computing', 'Theoretical Mathematics']
            },
            {
                name: 'Bachelor of Science (Hons) in Chemistry',
                duration: 4,
                options: ['Medicinal Chemistry', 'Polymer Chemistry', 'Water Chemistry', 'Environmental Chemistry']
            },
            {
                name: 'Bachelor of Science (Hons) in Biological Sciences',
                duration: 4,
                options: ['Environmental Biology', 'Molecular Biology and Genetics', 'Plant Science', 'Tropical Disease Biology']
            },
            { name: 'Bachelor of Science (Hons) in Applied Statistics and Analytics', duration: 4 },
        ],
    },
    {
        name: 'School of Wildlife and Environmental Sciences',
        programs: [
            { name: 'Bachelor of Science (Hons) in Freshwater and Fishery Science', duration: 4 },
            { name: 'Bachelor of Science (Hons) in Wildlife Ecology and Conservation', duration: 4 },
            { name: 'Bachelor of Science (Hons) in Environmental Conservation and Geo-Informatics', duration: 4 },
            { name: 'Bachelor of Science (Hons) in Environmental Science and Technology', duration: 4 },
        ],
    },
    {
        name: 'School of Art and Design',
        programs: [
            { name: 'Bachelor of Science (Hons) in Creative Art and Industrial Design', duration: 4 },
            { name: 'Bachelor of Science (Hons) in Visual Communication and Multimedia Design', duration: 4 },
            { name: 'Bachelor of Fine Art (Hons)', duration: 4 },
            { name: 'Bachelor of Science (Hons) in Clothing Fashion Design', duration: 4 },
        ],
    },
    {
        name: 'School of Hospitality and Tourism',
        programs: [
            { name: 'Bachelor of Science (Hons) in Hospitality and Tourism', duration: 4 },
            { name: 'Bachelor of Science (Hons) in Gastronomy and Culinary Arts', duration: 4 },
            { name: 'Bachelor of Science (Hons) in Travel, Leisure and Recreation', duration: 4 },
            { name: 'Bachelor of Science (Hons) in Event Management', duration: 4 },
        ],
    },
    {
        name: 'School of Health Sciences and Technology',
        programs: [
            { name: 'Bachelor of Science (Hons) in Biotechnology', duration: 4 },
            { name: 'Bachelor of Science (Hons) in Environmental Health', duration: 3.5 },
        ],
    },
    {
        name: 'Institute of Materials Science, Processing and Engineering Technology',
        programs: [
            { name: 'Bachelor of Science (Hons) in Materials Science and Engineering', duration: 5 },
        ],
    },
    {
        name: 'Institute of Lifelong Learning and Development Studies',
        programs: [
            { name: 'Bachelor of Arts (Hons) in Culture, Heritage Studies and Technology', duration: 4 },
        ],
    },
];

// Flatten all programs for easy searching
export const ALL_CUT_PROGRAMS = CUT_SCHOOLS.flatMap(school =>
    school.programs.map(program => ({
        ...program,
        school: school.name,
    }))
);
