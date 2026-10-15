Design a complete modern responsive web application called CampusConnect, a unified campus platform for university students.

The platform should bring several student services together in one system:

StudyConnect — students can discover, create and join study groups.
Lost & Found — students can report lost items and check the status of their reports, while a separate security-guard role manages found items and returns.
Second-Hand Textbook Marketplace — students can browse, search, sell and view second-hand textbooks.
Campus Events — students can discover upcoming campus events and view event details.

The main goal is to create one central campus platform rather than four unrelated applications.

Overall design direction

Create a professional, modern university web application with a clean and trustworthy visual style.

The design should feel:

Modern
Professional
Student-friendly
Clean
Accessible
Easy to navigate
Suitable for a real university environment

Avoid making it look like a social media platform or generic e-commerce website.

Use a consistent design system across the entire application.

Create a reusable component library containing:

Buttons
Cards
Navigation
Sidebar
Top navigation
Search bars
Filter controls
Forms
Input fields
Dropdowns
Modals
Tables
Status badges
Notification elements
Empty states
Loading states
Error states
Confirmation dialogs

Use consistent spacing, typography, border radius, shadows and component states.

Make the design responsive for:

Desktop
Tablet
Mobile
Branding

Application name: CampusConnect

Suggested tagline:
"Your campus, connected."

Create a simple professional logo/wordmark for CampusConnect.

Use a modern university-inspired colour palette. Keep the interface mostly neutral with one strong primary accent colour and appropriate secondary colours for success, warning and error states.

Use clear typography with strong hierarchy.

Main navigation

Create a persistent navigation system for students.

Sidebar/navigation items:

Dashboard
StudyConnect
Lost & Found
Marketplace
Events

Secondary items:

Profile
Settings
Logout

The active page should be clearly highlighted.

Include a notification icon and student profile menu in the top navigation.

Student Dashboard

Design the main student dashboard as the central hub of CampusConnect.

The dashboard should include:

Welcome message
Student profile summary
Quick actions
My study groups
Upcoming campus events
Recently listed textbooks
Lost & Found status
Notifications

Create dashboard cards for the four main services.

Example:

StudyConnect:
"3 active study groups"

Lost & Found:
"1 reported item"

Marketplace:
"12 new textbooks"

Events:
"4 upcoming events"

Include useful quick actions such as:

Find Study Group
Create Study Group
Browse Textbooks
View Events
Report Lost Item

The dashboard should provide useful information at a glance rather than simply being a menu.

StudyConnect

Design the StudyConnect section.

Create these screens:

Study group discovery page
Search/filter interface
Study group details page
Create study group page
My study groups page

Study group cards should display:

Group name
Module
Date
Time
Location
Number of members
Maximum capacity
Topics
Group status
Match/compatibility score where appropriate

Example:

COS301 Study Group

Saturday
10:00 – 12:00
Campus Library

6 / 8 members

Topics:
Data Structures
Recursion
Graphs

92% Match

[View Group]

Include filtering by:

Module
Campus/location
Date
Time
Availability

The group details page should show:

Group information
Members
Topics
Upcoming session
Group owner
Join/Leave button

The create-group form should include:

Group name
Module
Date
Time
Location
Maximum members
Topics
Lost & Found

This section has different permissions for students and security guards.

Student Lost & Found

Students should be able to:

Report a lost item
View their reported items
Check item status

Design:

Report Lost Item form
My Reports page
Item status page

Information should include:

Item name
Description
Location
Date lost
Status

Statuses:

Lost
Found
Returned
Security Guard Dashboard

Create a completely separate security interface.

Security guards should be able to:

View lost items
Register found items
Search items
View item details
Update item status
Mark items as returned
Record return information

The security dashboard should include statistics such as:

Total lost items
Found items
Items returned
Outstanding items

Use a table for item management.

Example columns:
Item
Location
Date
Status
Reported By
Actions

The security interface should look more administrative and functional than the student dashboard.

Second-Hand Textbook Marketplace

Design:

Marketplace home
Search/filter results
Textbook details
Sell textbook
My listings

Textbook cards should display:

Book title
Module
Price
Condition
Seller
Image
Availability

Filters:

Module
Price
Condition
Recently listed

Textbook detail page should show:

Large book image
Title
Module
Description
Condition
Price
Seller information
Contact seller button

Do not make this look like a large commercial e-commerce platform. Keep it focused on students selling second-hand academic textbooks.

Campus Events

Design:

Events listing
Event details
My registered events

Event cards should display:

Event title
Date
Time
Location
Category
Short description
Registration status

Categories could include:

Academic
Career
Sports
Student Society
Workshop
Social

Allow students to search and filter events.

Event details should include:

Event title
Date
Time
Location
Organiser
Description
Registration button
Authentication

Create:

Login page
Registration page
Forgot password page
Role-aware login experience

The system has at least two roles:

STUDENT
SECURITY_GUARD

Students should be directed to the Student Dashboard.

Security guards should be directed to the Security Dashboard.

Do not show security management functionality in the normal student navigation.

Important UX requirements

Make the interface intuitive enough that a student can understand it without instructions.

Use clear empty states.

For example:

"No study groups found."

"No upcoming events."

"You haven't listed any textbooks yet."

"You haven't reported any lost items."

Use confirmation dialogs for destructive actions such as:

Delete study group
Delete marketplace listing
Leave study group

Use appropriate success and error notifications.

Examples:
"Study group created successfully."
"You have joined the study group."
"Textbook listing created."
"Lost item report submitted."

Prototype interactions

Create a clickable prototype demonstrating the major user flows.

Student flow:

Login → Dashboard → StudyConnect → Group Details → Join Group

Dashboard → Marketplace → Textbook Details → Contact Seller

Dashboard → Events → Event Details → Register

Dashboard → Lost & Found → Report Lost Item → Confirmation

Security flow:

Login → Security Dashboard → Lost & Found Management → Item Details → Mark As Returned

Design system

Create reusable components and variants rather than designing each screen independently.

Maintain consistent:

Typography
Colours
Spacing
Icons
Buttons
Cards
Forms
Navigation
Status indicators

Use realistic sample content instead of placeholder text such as "Lorem ipsum".

Use realistic university examples such as modules, campus locations, study groups, textbooks and events.

The final result should look like a polished portfolio-level university platform that could realistically be developed using React and TypeScript for the frontend and Java Spring Boot with PostgreSQL for the backend.

Prioritise usability, consistency, accessibility and clear information hierarchy over excessive visual effects.