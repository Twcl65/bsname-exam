"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts"

// Sample data for charts
const studentUsageData = [
    { month: "Jan", students: 1200, exams: 3400 },
    { month: "Feb", students: 1350, exams: 3800 },
    { month: "Mar", students: 1500, exams: 4200 },
    { month: "Apr", students: 1650, exams: 4600 },
    { month: "May", students: 1800, exams: 5100 },
    { month: "Jun", students: 1923, exams: 5600 },
]

const mostAttemptedSubjects = [
    { subject: "Marine Engineering", attempts: 2450, passRate: 78 },
    { subject: "Navigation", attempts: 2100, passRate: 82 },
    { subject: "Ship Operations", attempts: 1950, passRate: 75 },
    { subject: "Safety Procedures", attempts: 1800, passRate: 85 },
    { subject: "Maritime Law", attempts: 1650, passRate: 70 },
    { subject: "Weather Systems", attempts: 1500, passRate: 88 },
]

const passRatesData = [
    { name: "Passed", value: 78, color: "#22c55e" },
    { name: "Failed", value: 22, color: "#ef4444" },
]


export function StudentUsageChart() {
    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="text-primary">Student Usage Trends</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={studentUsageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="students"
                            stroke="#1e40af"
                            strokeWidth={3}
                            name="Active Students"
                        />
                        <Line
                            type="monotone"
                            dataKey="exams"
                            stroke="#eab308"
                            strokeWidth={3}
                            name="Exams Taken"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export function MostAttemptedSubjectsChart() {
    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="text-primary">Most Attempted Subjects</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mostAttemptedSubjects}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="subject"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            fontSize={12}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="attempts" fill="#1e40af" name="Exam Attempts" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export function PassRatesChart() {
    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="text-primary">Overall Pass Rates</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={passRatesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {passRatesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

export function PassRatesPerSubject() {
    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="text-primary">Pass Rates per Subject</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mostAttemptedSubjects}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="subject"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            fontSize={12}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="passRate" fill="#eab308" name="Pass Rate (%)" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
