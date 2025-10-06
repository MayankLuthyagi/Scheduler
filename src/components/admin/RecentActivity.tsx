import Link from 'next/link';
import { FiUsers, FiMail, FiArrowRight } from 'react-icons/fi';

// Define types for props
interface AuthUser {
    _id: string;
    email: string;
    createdAt: string;
}

interface AuthEmail {
    _id:string;
    name: string;
    email: string;
    createdAt: string;
}

interface RecentActivityProps {
    users: AuthUser[];
    emails: AuthEmail[];
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

export default function RecentActivity({ users, emails }: RecentActivityProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Recent Users */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-600 flex items-center gap-2"><FiUsers /> Users</h3>
                        <Link href="/admin/users" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                            View All <FiArrowRight size={14} />
                        </Link>
                    </div>
                    <ul className="space-y-3">
                        {users.length > 0 ? users.map(user => (
                            <li key={user._id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-50">
                                <span className="text-gray-700 truncate">{user.email}</span>
                                <span className="text-gray-400 text-xs">{formatDate(user.createdAt)}</span>
                            </li>
                        )) : <p className="text-sm text-gray-500">No new users.</p>}
                    </ul>
                </div>

                {/* Recent Emails */}
                <div>
                     <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-600 flex items-center gap-2"><FiMail /> Sender Emails</h3>
                        <Link href="/admin/emails" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                           View All <FiArrowRight size={14} />
                        </Link>
                    </div>
                    <ul className="space-y-3">
                       {emails.length > 0 ? emails.map(email => (
                            <li key={email._id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-50">
                                <span className="text-gray-700 truncate">{email.email}</span>
                                <span className="text-gray-400 text-xs">{formatDate(email.createdAt)}</span>
                            </li>
                        )) : <p className="text-sm text-gray-500">No new emails.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
}