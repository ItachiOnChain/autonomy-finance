
import React, { useState } from 'react';
import { useStoryProtocol, type IPMetadata } from '../hooks/useStoryProtocol';
import { useNavigate } from 'react-router-dom';


export function IPMint() {
    const { mintIP, lockIPA, isLoading, error } = useStoryProtocol();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [mintedId, setMintedId] = useState<string | null>(null);
    const [step, setStep] = useState<'MINT' | 'LOCK'>('MINT');

    const handleMint = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const metadata: IPMetadata = {
                title,
                description,
                image: null // TODO: Add file upload
            };

            const result = await mintIP(metadata);
            if (result && result.ipaId) {
                setMintedId(result.ipaId);
                setStep('LOCK');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLock = async () => {
        if (!mintedId) return;
        try {
            // lockIPA now only takes ipaId - IP is not used as collateral, only for auto-repay
            await lockIPA(mintedId);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-white">Mint IP Asset</h1>

            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                {step === 'MINT' ? (
                    <form onSubmit={handleMint} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                IP Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                placeholder="e.g. My Exclusive Song"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 h-32"
                                placeholder="Describe your IP asset..."
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Minting...' : 'Mint IP Asset'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg">
                            <p className="font-bold">IP Minted Successfully!</p>
                            <p className="text-sm opacity-80 mt-1">ID: {mintedId}</p>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500 text-blue-300 p-4 rounded-lg">
                            <p className="font-bold mb-2">Next Step: Lock for Auto-Repay</p>
                            <p className="text-sm">
                                Locking your IP enables automatic debt repayment using royalties.
                                Your IP is <strong>NOT</strong> used as collateral for borrowing.
                            </p>
                        </div>

                        <button
                            onClick={handleLock}
                            disabled={isLoading}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Locking...' : 'Lock for Auto-Repay'}
                        </button>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            Skip for Now
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
