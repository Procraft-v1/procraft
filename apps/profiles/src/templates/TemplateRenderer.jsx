import ClassicTemplate from './classic/ClassicTemplate.jsx';
import MinimalTemplate from './minimal/MinimalTemplate.jsx';
import ModernTemplate from './modern/ModernTemplate.jsx';

const templates = {
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  modern: ModernTemplate,
};

export default function TemplateRenderer({ profile }) {
  const Template = templates[profile?.templateSlug] || MinimalTemplate;
  return <Template profile={profile} />;
}
