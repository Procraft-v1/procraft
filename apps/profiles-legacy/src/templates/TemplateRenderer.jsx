import ClassicTemplate from './classic/ClassicTemplate.jsx';
import DeveloperTemplate from './developer/DeveloperTemplate.jsx';
import EditorialTemplate from './editorial/EditorialTemplate.jsx';
import MinimalTemplate from './minimal/MinimalTemplate.jsx';
import ModernTemplate from './modern/ModernTemplate.jsx';

const templates = {
  classic: ClassicTemplate,
  developer: DeveloperTemplate,
  editorial: EditorialTemplate,
  minimal: MinimalTemplate,
  modern: ModernTemplate,
};

export default function TemplateRenderer({ profile }) {
  const Template = templates[profile?.templateSlug] || MinimalTemplate;
  return <Template profile={profile} />;
}
