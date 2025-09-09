const Patient = require('../models/patientModel');
const VitalSign = require('../models/vitalSignModel');
const User = require('../models/userModel');
const Billing = require('../models/billingModel');

// Get basic patient stats (counts by status, gender, blood type)
exports.getPatientStats = async (req, res) => {
  try {
    const stats = await Patient.aggregate([
      {
        $facet: {
          totalPatients: [{ $count: 'count' }],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byGender: [
            { $group: { _id: '$gender', count: { $sum: 1 } } }
          ],
          byBloodType: [
            { $group: { _id: '$blood_type', count: { $sum: 1 } } }
          ]
        }
      }
    ]);
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Staff performance metrics: number of patients assigned and active cases
exports.getStaffPerformance = async (req, res) => {
  try {
    const performance = await User.aggregate([
      { $match: { role: { $in: ['Doctor', 'Nurse'] } } },
      { $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'assigned_doctor',
          as: 'assignedPatients'
      }},
      { $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'assigned_nurse',
          as: 'assignedNursesPatients'
      }},
      { $project: {
          full_name: 1,
          role: 1,
          assignedDoctorCount: { $size: '$assignedPatients' },
          assignedNurseCount: { $size: '$assignedNursesPatients' },
        }
      }
    ]);
    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vital signs analytics: averages and trend summaries
exports.getVitalsTrends = async (req, res) => {
  try {
    const trends = await VitalSign.aggregate([
      { $group: {
          _id: null,
          avgHeartRate: { $avg: '$heart_rate' },
          avgTemperature: { $avg: '$temperature' },
          avgRespiratoryRate: { $avg: '$respiratory_rate' },
          maxGlucoseLevel: { $max: '$glucose_level' },
          minOxygenSaturation: { $min: '$oxygen_saturation' }
        }
      }
    ]);
    res.json(trends[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Financial metrics: billing totals by status and unpaid invoices
exports.getBillingStats = async (req, res) => {
  try {
    const stats = await Billing.aggregate([
      {
        $facet: {
          totalBilled: [ { $group: { _id: null, total: { $sum: '$total_amount' } } } ],
          byStatus: [ { $group: { _id: '$paid_status', total: { $sum: '$total_amount' } } } ],
          unpaidInvoices: [ { $match: { paid_status: 'unpaid' } }, { $count: 'count' } ]
        }
      }
    ]);
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dashboard overview endpoint combining key metrics
exports.getDashboard = async (req, res) => {
  try {
    const [patientStats, staffPerformance, vitalsTrends, billingStats] = await Promise.all([
      exports.getPatientStatsData(),
      exports.getStaffPerformanceData(),
      exports.getVitalsTrendsData(),
      exports.getBillingStatsData()
    ]);
    res.json({ patientStats, staffPerformance, vitalsTrends, billingStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper methods to invoke internal aggregations
exports.getPatientStatsData = () => Patient.aggregate([
  {
    $facet: {
      totalPatients: [{ $count: 'count' }],
      byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
      byGender: [{ $group: { _id: '$gender', count: { $sum: 1 } } }],
      byBloodType: [{ $group: { _id: '$blood_type', count: { $sum: 1 } } }]
    }
  }
]).then(results => results[0]);

exports.getStaffPerformanceData = () => User.aggregate([
  { $match: { role: { $in: ['Doctor', 'Nurse'] } } },
  { $lookup: {
      from: 'patients',
      localField: '_id',
      foreignField: 'assigned_doctor',
      as: 'assignedPatients'
  }},
  { $lookup: {
      from: 'patients',
      localField: '_id',
      foreignField: 'assigned_nurse',
      as: 'assignedNursesPatients'
  }},
  { $project: {
      full_name: 1,
      role: 1,
      assignedDoctorCount: { $size: '$assignedPatients' },
      assignedNurseCount: { $size: '$assignedNursesPatients' },
    }
  }
]);

exports.getVitalsTrendsData = () => VitalSign.aggregate([
  { $group: {
      _id: null,
      avgHeartRate: { $avg: '$heart_rate' },
      avgTemperature: { $avg: '$temperature' },
      avgRespiratoryRate: { $avg: '$respiratory_rate' },
      maxGlucoseLevel: { $max: '$glucose_level' },
      minOxygenSaturation: { $min: '$oxygen_saturation' }
    }
  }
]).then(results => results[0]);

exports.getBillingStatsData = () => Billing.aggregate([
  {
    $facet: {
      totalBilled: [ { $group: { _id: null, total: { $sum: '$total_amount' } } } ],
      byStatus: [ { $group: { _id: '$paid_status', total: { $sum: '$total_amount' } } } ],
      unpaidInvoices: [ { $match: { paid_status: 'unpaid' } }, { $count: 'count' } ]
    }
  }
]).then(results => results[0]);
