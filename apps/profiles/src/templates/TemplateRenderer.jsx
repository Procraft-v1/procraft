import ClassicTemplate from './ClassicTemplate.jsx';
import MinimalTemplate from './MinimalTemplate.jsx';
import ModernTemplate from './ModernTemplate.jsx';

const templates = {
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  modern: ModernTemplate,
};

export default function TemplateRenderer({ profile }) {
  const Template = templates[profile?.templateSlug] || MinimalTemplate;
  return <Template profile={profile} />;
}
