import ProfileAlert from '../components/ProfileAlert';

// Same copy the legacy SPA rendered for missing/erroring profiles, now with
// a proper 404 status code for crawlers.
export default function NotFound() {
  return <ProfileAlert type="warning" message="Profile not found." />;
}
